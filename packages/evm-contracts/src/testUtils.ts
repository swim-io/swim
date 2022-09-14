/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";

import type { Pool } from "../typechain-types/contracts/Pool";
import type { ERC20Token } from "../typechain-types/contracts/test/ERC20Token";

import { TOKEN_NUMBERS } from "./config";
import { confirm, getProxy } from "./deploy";

export class TokenWrapper {
  constructor(
    private readonly token: ERC20Token,
    readonly decimals: number,
    readonly symbol: string
  ) {}

  get contract() {
    return this.token;
  }

  get tokenNumber() {
    return TOKEN_NUMBERS[this.symbol as keyof typeof TOKEN_NUMBERS];
  }

  static create = async (contract: ERC20Token) =>
    new TokenWrapper(contract, await contract.decimals(), await contract.symbol());

  toAtomic = (human: BigNumberish) =>
    parseFixed(typeof human === "string" ? human : human.toString(), this.decimals);

  toHuman = (atomic: BigNumberish) => formatFixed(atomic, this.decimals);

  balanceOf = (account: { readonly address: string }) => this.token.balanceOf(account.address);

  totalSupply = () => this.token.totalSupply();
  approve = (from: SignerWithAddress, to: { readonly address: string }, amount: BigNumberish) =>
    confirm(this.token.connect(from).approve(to.address, amount));

  mint = (to: { readonly address: string }, amount: BigNumberish) =>
    confirm(this.token.mint(to.address, amount));

  burn = (from: SignerWithAddress, amount: BigNumberish) =>
    confirm(this.token.connect(from).burn(amount));
}

export class PoolWrapper {
  constructor(
    private readonly pool: Pool,
    readonly tokens: readonly TokenWrapper[],
    readonly lpToken: TokenWrapper
  ) {}

  get address() {
    return this.pool.address;
  }

  get contract() {
    return this.pool;
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

  add = async (
    from: SignerWithAddress,
    inputAmounts: readonly BigNumberish[],
    minimumMintAmount: BigNumberish
  ) => {
    await this.approveAll(from, inputAmounts);
    return this.call(from, "add(uint256[],uint256)", [inputAmounts, minimumMintAmount]);
  };

  removeUniform = async (
    from: SignerWithAddress,
    burnAmount: BigNumberish,
    minimumOutputAmounts: readonly BigNumberish[]
  ) => {
    await this.lpToken.approve(from, this.pool, burnAmount);
    return this.call(from, "removeUniform(uint256,uint256[])", [burnAmount, minimumOutputAmounts]);
  };

  removeExactBurn = async (
    from: SignerWithAddress,
    burnAmount: BigNumberish,
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) => {
    await this.lpToken.approve(from, this.pool, burnAmount);
    return this.call(from, "removeExactBurn(uint256,uint8,uint256)", [
      burnAmount,
      outputTokenIndex,
      minimumOutputAmount,
    ]);
  };

  removeExactOutput = async (
    from: SignerWithAddress,
    outputAmounts: readonly BigNumberish[],
    maximumBurnAmount: BigNumberish
  ) => {
    await this.lpToken.approve(from, this.pool, maximumBurnAmount);
    return this.call(from, "removeExactOutput(uint256[],uint256)", [
      outputAmounts,
      maximumBurnAmount,
    ]);
  };

  swap = async (
    from: SignerWithAddress,
    inputAmount: BigNumberish,
    inputTokenIndex: number,
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) => {
    await this.tokens[inputTokenIndex].approve(from, this.pool, inputAmount);
    return this.call(from, "swap", [
      inputAmount,
      inputTokenIndex,
      outputTokenIndex,
      minimumOutputAmount,
    ]);
  };

  swapExactInput = async (
    from: SignerWithAddress,
    inputAmounts: readonly BigNumberish[],
    outputTokenIndex: number,
    minimumOutputAmount: BigNumberish
  ) => {
    await this.approveAll(from, inputAmounts);
    return this.call(from, "swapExactInput", [inputAmounts, outputTokenIndex, minimumOutputAmount]);
  };

  swapExactOutput = async (
    from: SignerWithAddress,
    maximumInputAmount: BigNumberish,
    inputTokenIndex: number,
    outputAmounts: readonly BigNumberish[]
  ) => {
    await this.tokens[inputTokenIndex].approve(from, this.pool, maximumInputAmount);
    return this.call(from, "swapExactOutput", [maximumInputAmount, inputTokenIndex, outputAmounts]);
  };

  private readonly call = (from: SignerWithAddress, method: string, args: readonly any[]) =>
    confirm((this.pool.connect(from) as Contract)[method](...args));

  private readonly approveAll = (from: SignerWithAddress, amounts: readonly BigNumberish[]) =>
    Promise.all(
      this.tokens.map((token, i) =>
        BigNumber.from(amounts[i]).isZero()
          ? Promise.resolve()
          : token.approve(from, this.pool, amounts[i])
      )
    );
}
