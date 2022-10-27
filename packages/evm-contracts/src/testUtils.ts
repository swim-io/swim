/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import { formatFixed, parseFixed } from "@ethersproject/bignumber";
import { hexlify } from "@ethersproject/bytes";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { Decimalish } from "@swim-io/pool-math";
import { PoolMath, toDecimal } from "@swim-io/pool-math";
import { TOKEN_PROJECTS_BY_ID, TokenProjectId } from "@swim-io/token-projects";
import { BN } from "bn.js";
import { expect, use } from "chai";
import type Decimal from "decimal.js";
import type { BigNumberish, BytesLike, Contract } from "ethers";
import { ethers } from "hardhat";

import type { Pool } from "../typechain-types/contracts/Pool";
import type { Routing } from "../typechain-types/contracts/Routing";
import type { ERC20Token } from "../typechain-types/contracts/test/ERC20Token";

import { GAS_TOKEN_DECIMALS, POOL_PRECISION, ROUTING_PRECISION } from "./config";
import { confirm, getProxy, getRoutingProxy } from "./deploy";

// eslint-disable-next-line import/no-commonjs, @typescript-eslint/no-var-requires
use(require("chai-bn")(BN));

export const tolerance = 2 * 10 ** -POOL_PRECISION;

export type { Decimalish };
export type HasAddress = { readonly address: string };

export { toDecimal };

const call = (contract: Contract, from: SignerWithAddress, method: string, args: readonly any[]) =>
  confirm(contract.connect(from)[method](...args));

export class TokenWrapper {
  readonly tokenNumber: number | null;

  constructor(readonly contract: ERC20Token, readonly decimals: number, readonly symbol: string) {
    this.tokenNumber =
      symbol === "swimUSD" //TODO workaround for token-projects not knowing new swimUSD yet
        ? 0
        : Object.values(TokenProjectId)
            .map((id) => TOKEN_PROJECTS_BY_ID[id])
            //TODO we're using includes() and lenght checking here instead of === here because e.g.
            //      on Avalanche USDC is called aUSDC... ultimately a better solution than this is
            //      obviously required to dynamically look up tokennumbers
            .filter(
              (project) =>
                symbol.includes(project.symbol) &&
                Math.abs(symbol.length - project.symbol.length) < 2
            )[0]?.tokenNumber;
  }

  get address() {
    return this.contract.address;
  }

  static create = async (contract: ERC20Token) =>
    new TokenWrapper(contract, await contract.decimals(), await contract.symbol());

  toAtomic = (human: Decimalish) =>
    parseFixed(toDecimal(human).toFixed(this.decimals), this.decimals);

  toHuman = (atomic: BigNumberish) => toDecimal(formatFixed(atomic, this.decimals));

  balanceOf = async (account: HasAddress) =>
    this.toHuman(await this.contract.balanceOf(account.address));

  allowance = async (owner: HasAddress, spender: HasAddress) =>
    this.toHuman(await this.contract.allowance(owner.address, spender.address));

  totalSupply = async () => this.toHuman(await this.contract.totalSupply());

  transfer = (from: SignerWithAddress, to: HasAddress, amount: Decimalish) =>
    confirm(this.contract.connect(from).transfer(to.address, this.toAtomic(amount)));

  approve = (from: SignerWithAddress, to: HasAddress, amount: Decimalish) =>
    confirm(this.contract.connect(from).approve(to.address, this.toAtomic(amount)));

  mint = (to: HasAddress, amount: Decimalish) =>
    confirm(this.contract.mint(to.address, this.toAtomic(amount)));

  burn = (from: SignerWithAddress, amount: Decimalish) =>
    confirm(this.contract.connect(from).burn(this.toAtomic(amount)));
}

export class PoolWrapper {
  private constructor(
    readonly contract: Pool,
    readonly tokens: readonly TokenWrapper[],
    readonly lpToken: TokenWrapper
  ) {}

  get address() {
    return this.contract.address;
  }

  static create = async (salt: string) => {
    const pool = (await getProxy("Pool", salt)) as Pool;
    const state = await pool.getState();

    return new PoolWrapper(
      pool,
      await Promise.all(
        state.balances.map(async (balance) =>
          TokenWrapper.create(await ethers.getContractAt("ERC20Token", balance.tokenAddress))
        )
      ),
      await TokenWrapper.create(
        (await ethers.getContractAt("LpToken", await pool.getLpToken())) as ERC20Token
      )
    );
  };

  async poolmath() {
    const state = await this.contract.getState();
    return new PoolMath(
      state.balances.map((b, i) => toDecimal(formatFixed(b.balance, this.tokens[i].decimals))),
      toDecimal(formatFixed(state.ampFactor.value, state.ampFactor.decimals)),
      toDecimal(formatFixed(state.lpFee.value, state.lpFee.decimals)),
      toDecimal(formatFixed(state.governanceFee.value, state.governanceFee.decimals)),
      toDecimal(formatFixed(state.totalLpSupply.balance, this.lpToken.decimals))
    );
  }

  async getMarginalPrices() {
    return (await this.contract.getMarginalPrices()).map((decimalStruct) =>
      toDecimal(ethers.utils.formatUnits(decimalStruct.value, decimalStruct.decimals))
    );
  }

  async add(
    from: SignerWithAddress,
    inputAmounts: readonly Decimalish[],
    minimumMintAmount: Decimalish
  ) {
    await this.approveAll(from, inputAmounts);
    return call(this.contract, from, "add(uint256[],uint256)", [
      this.toAtomicAmounts(inputAmounts),
      this.lpToken.toAtomic(minimumMintAmount),
    ]);
  }

  async removeUniform(
    from: SignerWithAddress,
    burnAmount: Decimalish,
    minimumOutputAmounts: readonly Decimalish[]
  ) {
    //no lp approval required
    return call(this.contract, from, "removeUniform(uint256,uint256[])", [
      this.lpToken.toAtomic(burnAmount),
      this.toAtomicAmounts(minimumOutputAmounts),
    ]);
  }

  async removeExactBurn(
    from: SignerWithAddress,
    burnAmount: Decimalish,
    outputTokenIndex: number,
    minimumOutputAmount: Decimalish
  ) {
    //no lp approval required
    return call(this.contract, from, "removeExactBurn(uint256,uint8,uint256)", [
      this.lpToken.toAtomic(burnAmount),
      outputTokenIndex,
      this.tokens[outputTokenIndex].toAtomic(minimumOutputAmount),
    ]);
  }

  async removeExactOutput(
    from: SignerWithAddress,
    outputAmounts: readonly Decimalish[],
    maximumBurnAmount: Decimalish
  ) {
    //no lp approval required
    return call(this.contract, from, "removeExactOutput(uint256[],uint256)", [
      this.toAtomicAmounts(outputAmounts),
      this.lpToken.toAtomic(maximumBurnAmount),
    ]);
  }

  async swap(
    from: SignerWithAddress,
    inputAmount: Decimalish,
    inputTokenIndex: number,
    outputTokenIndex: number,
    minimumOutputAmount: Decimalish
  ) {
    await this.tokens[inputTokenIndex].approve(from, this.contract, inputAmount);
    return call(this.contract, from, "swap", [
      this.tokens[inputTokenIndex].toAtomic(inputAmount),
      inputTokenIndex,
      outputTokenIndex,
      this.tokens[outputTokenIndex].toAtomic(minimumOutputAmount),
    ]);
  }

  async swapExactInput(
    from: SignerWithAddress,
    inputAmounts: readonly Decimalish[],
    outputTokenIndex: number,
    minimumOutputAmount: Decimalish
  ) {
    await this.approveAll(from, inputAmounts);
    return call(this.contract, from, "swapExactInput", [
      this.toAtomicAmounts(inputAmounts),
      outputTokenIndex,
      this.tokens[outputTokenIndex].toAtomic(minimumOutputAmount),
    ]);
  }

  async swapExactOutput(
    from: SignerWithAddress,
    maximumInputAmount: Decimalish,
    inputTokenIndex: number,
    outputAmounts: readonly Decimalish[]
  ) {
    await this.tokens[inputTokenIndex].approve(from, this.contract, maximumInputAmount);
    return call(this.contract, from, "swapExactOutput", [
      this.tokens[inputTokenIndex].toAtomic(maximumInputAmount),
      inputTokenIndex,
      this.toAtomicAmounts(outputAmounts),
    ]);
  }

  private readonly toAtomicAmounts = (human: readonly Decimalish[]) =>
    this.tokens.map((t, i) => t.toAtomic(human[i]));

  private async approveAll(from: SignerWithAddress, amounts: readonly Decimalish[]) {
    for (let i = 0; i < this.tokens.length; ++i) {
      const token = this.tokens[i];
      if (!(await token.allowance(from, this)).eq(amounts[i]))
        await token.approve(from, this.contract, amounts[i]);
    }
  }
}

export class RoutingWrapper {
  private constructor(readonly contract: Routing, readonly swimUsd: TokenWrapper) {}

  get address() {
    return this.contract.address;
  }

  static create = async () => {
    const contract = await getRoutingProxy();
    const swimUsd = await TokenWrapper.create(
      await ethers.getContractAt("ERC20Token", await contract.swimUsdAddress())
    );
    return new RoutingWrapper(contract, swimUsd);
  };

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
    inputAmount: Decimalish,
    toOwner: HasAddress,
    toToken: TokenWrapper,
    minimumOutputAmount: Decimalish,
    memo?: BytesLike
  ) {
    await fromToken.approve(from, this, inputAmount);
    return this.memoCall(
      from,
      "onChainSwap(address,uint256,address,address,uint256)",
      [
        fromToken.address,
        fromToken.toAtomic(inputAmount),
        toOwner.address,
        toToken.address,
        toToken.toAtomic(minimumOutputAmount),
      ],
      memo
    );
  }

  async crossChainInitiate(
    from: SignerWithAddress,
    fromToken: TokenWrapper,
    inputAmount: Decimalish,
    firstMinimumOutputAmount: Decimalish,
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
        fromToken.toAtomic(inputAmount),
        this.swimUsd.toAtomic(firstMinimumOutputAmount),
        wormholeRecipientChain,
        this.asBytes32(toOwner),
      ],
      memo
    );
  }

  async propellerInitiate(
    from: SignerWithAddress,
    fromToken: TokenWrapper,
    inputAmount: Decimalish,
    wormholeRecipientChain: number,
    toOwner: HasAddress | BytesLike,
    gasKickstart: boolean,
    maxPropellerFee: Decimalish,
    toTokenNumber: number,
    memo?: BytesLike
  ) {
    await fromToken.approve(from, this, inputAmount);
    return this.memoCall(
      from,
      "propellerInitiate(address,uint256,uint16,bytes32,bool,uint64,uint16)",
      [
        fromToken.address,
        fromToken.toAtomic(inputAmount),
        wormholeRecipientChain,
        this.asBytes32(toOwner),
        gasKickstart,
        this.swimUsd.toAtomic(maxPropellerFee),
        toTokenNumber,
      ],
      memo
    );
  }

  async crossChainComplete(
    from: SignerWithAddress,
    encodedVm: BytesLike,
    toToken: TokenWrapper,
    minimumOutputAmount: Decimalish,
    memo?: BytesLike
  ) {
    return this.memoCall(
      from,
      "crossChainComplete(bytes,address,uint256)",
      [encodedVm, toToken.address, toToken.toAtomic(minimumOutputAmount)],
      memo
    );
  }

  async propellerComplete(from: SignerWithAddress, encodedVm: BytesLike) {
    return confirm(this.contract.connect(from).propellerComplete(encodedVm));
  }

  async propellerFeeConfig() {
    const feeConfig = await this.contract.propellerFeeConfig();
    if (feeConfig.method > 1)
      throw Error(`unrecognized propeller fee config method: ${feeConfig.method}`);
    const method =
      feeConfig.method === 0 ? ("fixedSwimUsdPerGasToken" as const) : ("uniswapOracle" as const);
    return {
      method,
      serviceFee: this.swimUsd.toHuman(feeConfig.serviceFee),
      fixedSwimUsdPerGasToken: toDecimal(feeConfig.fixedSwimUsdPerGasToken.toString()).mul(
        toDecimal(10).pow(-ROUTING_PRECISION - this.swimUsd.decimals + GAS_TOKEN_DECIMALS)
      ),
      uniswap: {
        //TODO the information in here should be converted further into a more usable form
        swimPool: feeConfig.uniswap.swimPool,
        swimIntermediateIndex: feeConfig.uniswap.swimPool,
        uniswapPool: feeConfig.uniswap.uniswapPool,
        uniswapIntermediateIsFirst: feeConfig.uniswap.uniswapIntermediateIsFirst,
      },
    };
  }

  async usePropellerFixedGasTokenPrice(
    owner: SignerWithAddress,
    fixedSwimUsdPerGasToken: Decimalish //in human i.e. intuitive units
  ) {
    return confirm(
      this.contract.connect(owner).usePropellerFixedGasTokenPrice({
        value: parseFixed(
          toDecimal(fixedSwimUsdPerGasToken)
            .mul(toDecimal(10).pow(this.swimUsd.decimals - GAS_TOKEN_DECIMALS))
            .toFixed(),
          ROUTING_PRECISION
        ),
        decimals: ROUTING_PRECISION,
      })
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

export async function expectEqual(
  token: TokenWrapper,
  actual: HasAddress | Decimal,
  expected: Decimalish
) {
  expect(token.toAtomic("address" in actual ? await token.balanceOf(actual) : actual)).to.equal(
    token.toAtomic(expected)
  );
}

export async function expectCloseTo(
  token: TokenWrapper,
  actual: HasAddress | Decimal,
  expected: Decimalish,
  toleranceMultiplier = 1
) {
  //TODO find a better way to make "close to" comparisons than by going through BigNumber
  expect(
    token.toAtomic("address" in actual ? await token.balanceOf(actual) : actual)
  ).to.be.closeTo(token.toAtomic(expected), token.toAtomic(tolerance).mul(toleranceMultiplier));
}
