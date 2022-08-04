/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Given, When } from "@cucumber/cucumber";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";
import {
  SwapDirection,
  createApproveAndSwapIxs,
  createPoolMath,
  fetchSwimPool,
} from "@swim-io/solana-usdc-usdt-swap";
import Decimal from "decimal.js";

Given(
  "there is a Solana-only pool with {word} and {word} tokens, an amp factor of {float}, an LP fee of {float}%, and a governance fee of {float}%",
  function (
    token1: string,
    token2: string,
    ampFactor: number,
    lpFee: number,
    governanceFee: number,
  ) {
    // TODO: Set up pool
    this.poolTokens = [token1, token2];
  },
);

Given(
  "{float} {word} has been deposited into the pool",
  function (amount: number, token: string) {
    // TODO: Deposit to pool
  },
);

When(
  "{word} swaps an exact input of {float} {word} for {word} with a slippage setting of {float}%",
  async function (
    user: string,
    amount: number,
    fromToken: string,
    toToken: string,
    slippage: number,
  ) {
    const solanaConnection = this.solanaConnection as Connection;
    const pool = await fetchSwimPool(solanaConnection);
    const poolMath = createPoolMath(pool);
    const inputAmount = new Decimal(amount);
    // TODO: Handle token direction generically
    const inputAmounts = [inputAmount, new Decimal(0)];
    const outputIndex = 1;
    const outputAmount = poolMath.swapExactInput(
      inputAmounts,
      outputIndex,
    ).stableOutputAmount;
    const minimumOutputAmount = outputAmount.mul(1 - slippage / 100);
    const userWallet = this.solanaWallet as Keypair;
    const userDelegate = Keypair.generate();
    const userTokenKeys = [
      this.userTokenKeys[this.poolTokens[0]],
      this.userTokenKeys[this.poolTokens[1]],
    ] as readonly [PublicKey, PublicKey];
    const ixs = createApproveAndSwapIxs(
      SwapDirection.UsdcToUsdt,
      inputAmount,
      minimumOutputAmount,
      userTokenKeys,
      userDelegate.publicKey,
      userWallet.publicKey,
    );
    const { blockhash, lastValidBlockHeight } =
      await solanaConnection.getLatestBlockhash();
    const tx = new Transaction({
      feePayer: userWallet.publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs);
    const signers = [userWallet, userDelegate];
    this.txId = await solanaConnection.sendTransaction(tx, signers);

    // TODO: Use the step description to design the SDK interface
    // this.txId = await sdk.swap(userWallet, inputAmount, fromToken, toToken, slippage);
  },
);
