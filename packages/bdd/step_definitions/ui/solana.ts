/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import assert from "assert";

import { Given, Then } from "@cucumber/cucumber";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

async function getUserBalance(this: any, token: string): Promise<Decimal> {
  const userTokenKey = this.userTokenKeys[token] as PublicKey;
  const balance: string = await this.wallet.getTokenAccountBalance(
    userTokenKey,
  );
  return new Decimal(balance);
}

Given("there is a Solana blockchain", function () {
  // TODO: Set up a development chain
});

Given(
  "{word} has a Solana wallet with address {string}",
  function (user: string, address: string) {
    // TODO: Set up Phantom
    this.wallet = (window as any).phantom.solana;
  },
);

Given(
  "{word} has {float} SOL in his Solana wallet",
  function (user: string, amount: number) {
    // TODO: Seed wallet with SOL
  },
);

Given(
  "{word} has a {word} token account with address {string}",
  function (user: string, token: string, address: string) {
    this.userTokenKeys = this.userTokenKeys ?? {};
    this.userTokenKeys[token] = new PublicKey(address);
    // TODO: Seed wallet with tokens
  },
);

Given(
  "{word} has {float} {word} tokens in his Solana wallet",
  function (user: string, amount: number, token: string) {
    // TODO: Seed wallet with tokens
  },
);

Then(
  "{word}'s {word} balance should be {float}",
  async function (user: string, token: string, amount: number) {
    const balance = await getUserBalance.call(this, token);
    assert(balance.equals(amount));
  },
);

Then(
  "{word}'s {word} balance should be at least {float}",
  async function (user: string, token: string, amount: number) {
    const balance = await getUserBalance.call(this, token);
    assert(balance.greaterThanOrEqualTo(amount));
  },
);
