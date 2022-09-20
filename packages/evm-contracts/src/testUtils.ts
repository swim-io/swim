/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import { hexlify } from "@ethersproject/bytes";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { BigNumberish, BytesLike, Contract } from "ethers";
import { ethers } from "hardhat";

import type { Pool } from "../typechain-types/contracts/Pool";
import type { Routing } from "../typechain-types/contracts/Routing";
import type { ERC20Token } from "../typechain-types/contracts/test/ERC20Token";

import { TOKEN_NUMBERS } from "./config";
import { confirm, getProxy } from "./deploy";

export type HasAddress = { readonly address: string };

const call = (contract: Contract, from: SignerWithAddress, method: string, args: readonly any[]) =>
  confirm(contract.connect(from)[method](...args));

export class TokenWrapper {
  constructor(readonly contract: ERC20Token, readonly decimals: number, readonly symbol: string) {}

  get address() {
    return this.contract.address;
  }

  get tokenNumber() {
    return TOKEN_NUMBERS[this.symbol as keyof typeof TOKEN_NUMBERS];
  }

  static create = async (contract: ERC20Token) =>
    new TokenWrapper(contract, await contract.decimals(), await contract.symbol());

  toAtomic = (human: BigNumberish) =>
    parseFixed(typeof human === "string" ? human : human.toString(), this.decimals);

  toHuman = (atomic: BigNumberish) => formatFixed(atomic, this.decimals);

  balanceOf = (account: HasAddress) => this.contract.balanceOf(account.address);

  totalSupply = () => this.contract.totalSupply();

  approve = (from: SignerWithAddress, to: HasAddress, amount: BigNumberish) =>
    confirm(this.contract.connect(from).approve(to.address, amount));

  mint = (to: HasAddress, amount: BigNumberish) => confirm(this.contract.mint(to.address, amount));

  burn = (from: SignerWithAddress, amount: BigNumberish) =>
    confirm(this.contract.connect(from).burn(amount));
}

export class PoolWrapper {
  constructor(
    readonly contract: Pool,
    readonly tokens: readonly TokenWrapper[],
    readonly lpToken: TokenWrapper
  ) {}

  get address() {
    return this.contract.address;
  }

  static create = async (salt: string, tokens: readonly TokenWrapper[]) => {
    const pool = (await getProxy("Pool", salt)) as Pool;
    return new PoolWrapper(
      pool,
      tokens,
      await TokenWrapper.create(
        (await ethers.getContractAt("LpToken", await pool.getLpToken())) as ERC20Token
      )
    );
  };

  toAtomicAmounts = (human: BigNumberish | readonly BigNumberish[]) =>
    this.tokens.map((t, i) => t.toAtomic(Array.isArray(human) ? human[i] : human));

  async getMarginalPrices() {
    return (await this.contract.getMarginalPrices()).map((decimalStruct) =>
      ethers.utils.formatUnits(decimalStruct.value, decimalStruct.decimals)
    );
  }

  async add(
    from: SignerWithAddress,
    inputAmounts: readonly BigNumberish[],
    minimumMintAmount: BigNumberish
  ) {
    await this.approveAll(from, inputAmounts);
    return call(this.contract, from, "add(uint256[],uint256)", [inputAmounts, minimumMintAmount]);
  }

  async removeUniform(
    from: SignerWithAddress,
    burnAmount: BigNumberish,
    minimumOutputAmounts: readonly BigNumberish[]
  ) {
    //no lp approval required
    return call(this.contract, from, "removeUniform(uint256,uint256[])", [
      burnAmount,
      minimumOutputAmounts,
    ]);
  }

  async removeExactBurn(
    from: SignerWithAddress,
    burnAmount: BigNumberish,
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) {
    //no lp approval required
    return call(this.contract, from, "removeExactBurn(uint256,uint8,uint256)", [
      burnAmount,
      outputTokenIndex,
      minimumOutputAmount,
    ]);
  }

  async removeExactOutput(
    from: SignerWithAddress,
    outputAmounts: readonly BigNumberish[],
    maximumBurnAmount: BigNumberish
  ) {
    //no lp approval required
    return call(this.contract, from, "removeExactOutput(uint256[],uint256)", [
      outputAmounts,
      maximumBurnAmount,
    ]);
  }

  async swap(
    from: SignerWithAddress,
    inputAmount: BigNumberish,
    inputTokenIndex: number,
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) {
    await this.tokens[inputTokenIndex].approve(from, this.contract, inputAmount);
    return call(this.contract, from, "swap", [
      inputAmount,
      inputTokenIndex,
      outputTokenIndex,
      minimumOutputAmount,
    ]);
  }

  async swapExactInput(
    from: SignerWithAddress,
    inputAmounts: readonly BigNumberish[],
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) {
    await this.approveAll(from, inputAmounts);
    return call(this.contract, from, "swapExactInput", [
      inputAmounts,
      outputTokenIndex,
      minimumOutputAmount,
    ]);
  }

  async swapExactOutput(
    from: SignerWithAddress,
    maximumInputAmount: BigNumberish,
    inputTokenIndex: number,
    outputAmounts: readonly BigNumberish[]
  ) {
    await this.tokens[inputTokenIndex].approve(from, this.contract, maximumInputAmount);
    return call(this.contract, from, "swapExactOutput", [
      maximumInputAmount,
      inputTokenIndex,
      outputAmounts,
    ]);
  }

  private readonly approveAll = (from: SignerWithAddress, amounts: readonly BigNumberish[]) =>
    Promise.all(
      this.tokens.map((token, i) =>
        BigNumber.from(amounts[i]).isZero()
          ? Promise.resolve()
          : token.approve(from, this.contract, amounts[i])
      )
    );
}

export class RoutingWrapper {
  constructor(readonly contract: Routing) {}

  get address() {
    return this.contract.address;
  }

  async getMemoInteractionEvents(memo?: BytesLike) {
    //we have to manually right-pad with zeros because either hardhat or ethers
    // are screwing up the look-up otherwise.... solid software
    const filter = memo
      ? this.contract.filters.MemoInteraction(hexlify(memo) + "00".repeat(16))
      : this.contract.filters.MemoInteraction();
    return this.contract.queryFilter(filter);
  }

  async onChainSwap(
    from: SignerWithAddress,
    fromToken: TokenWrapper,
    inputAmount: BigNumberish,
    toOwner: HasAddress,
    toToken: TokenWrapper,
    minimumOutputAmount: BigNumberish,
    memo?: BytesLike
  ) {
    await fromToken.approve(from, this, inputAmount);
    return this.memoCall(
      from,
      "onChainSwap(address,uint256,address,address,uint256)",
      [fromToken.address, inputAmount, toOwner.address, toToken.address, minimumOutputAmount],
      memo
    );
  }

  async crossChainInitiate(
    from: SignerWithAddress,
    fromToken: TokenWrapper,
    inputAmount: BigNumberish,
    firstMinimumOutputAmount: BigNumberish,
    wormholeRecipientChain: number,
    toOwner: HasAddress | BytesLike,
    memo?: BytesLike
  ) {
    await fromToken.approve(from, this, inputAmount);
    return this.memoCall(
      from,
      "crossChainInitiate(address,uint256,uint256,uint16,bytes32)",
      [
        fromToken.address,
        inputAmount,
        firstMinimumOutputAmount,
        wormholeRecipientChain,
        this.asBytes32(toOwner),
      ],
      memo
    );
  }

  async propellerInitiate(
    from: SignerWithAddress,
    fromToken: TokenWrapper,
    inputAmount: BigNumberish,
    wormholeRecipientChain: number,
    toOwner: HasAddress | BytesLike,
    gasKickstart: boolean,
    maxPropellerFee: BigNumberish,
    toTokenNumber: number,
    memo?: BytesLike
  ) {
    await fromToken.approve(from, this, inputAmount);
    return this.memoCall(
      from,
      "propellerInitiate(address,uint256,uint16,bytes32,bool,uint64,uint16)",
      [
        fromToken.address,
        inputAmount,
        wormholeRecipientChain,
        this.asBytes32(toOwner),
        gasKickstart,
        maxPropellerFee,
        toTokenNumber,
      ],
      memo
    );
  }

  async crossChainComplete(
    from: SignerWithAddress,
    encodedVm: BytesLike,
    toToken: TokenWrapper,
    minimumOutputAmount: BigNumberish,
    memo?: BytesLike
  ) {
    return this.memoCall(
      from,
      "crossChainComplete(bytes,address,uint256)",
      [encodedVm, toToken.address, minimumOutputAmount],
      memo
    );
  }

  async propellerComplete(from: SignerWithAddress, encodedVm: BytesLike) {
    return confirm(this.contract.connect(from).propellerComplete(encodedVm));
  }

  async propellerFeeConfig() {
    return await this.contract.propellerFeeConfig();
  }

  async usePropellerFixedGasTokenPrice(
    owner: SignerWithAddress,
    fixedSwimUsdPerGasToken: BigNumberish
  ) {
    return confirm(
      this.contract.connect(owner).usePropellerFixedGasTokenPrice(fixedSwimUsdPerGasToken)
    );
  }

  async usePropellerUniswapOracle(
    owner: SignerWithAddress,
    intermediateToken: TokenWrapper,
    uniswapPool: Contract
  ) {
    return confirm(
      this.contract
        .connect(owner)
        .usePropellerUniswapOracle(intermediateToken.address, uniswapPool.address)
    );
  }

  private readonly memoCall = (
    from: SignerWithAddress,
    method: string,
    args: readonly any[],
    memo?: BytesLike
  ) =>
    call(
      this.contract,
      from,
      memo ? method.slice(0, -1) + ",bytes16)" : method,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      memo ? [...args, memo] : args
    );

  private readonly asBytes32 = (val: HasAddress | BytesLike) =>
    typeof val === "object" && "address" in val
      ? Buffer.from("00".repeat(12) + val.address.slice(2), "hex")
      : val;
}
