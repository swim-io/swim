/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import assert from "assert";

import { Given, Then } from "@cucumber/cucumber";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

async function getUserBalance(this: any, token: string): Promise<Decimal> {
  const userTokenKey = this.userTokenKeys[token] as PublicKey;
  const solanaConnection = this.solanaConnection as Connection;
  const { value } = await solanaConnection.getTokenAccountBalance(userTokenKey);
  return new Decimal(value.amount).div(value.decimals);
}

Given("there is a Solana blockchain", function () {
  // TODO: Set up a development chain
  this.solanaConnection = new Connection("http://127.0.0.1");
});

Given(
  "{word} has a Solana wallet with address {string}",
  function (user: string, address: string) {
    // TODO: Use a look-up table to match addresses to secret keys
    this.solanaWallet = Keypair.fromSecretKey(
      Uint8Array.from([
        14, 173, 153, 4, 176, 224, 201, 111, 32, 237, 183, 185, 159, 247, 22,
        161, 89, 84, 215, 209, 212, 137, 10, 92, 157, 49, 29, 192, 101, 164,
        152, 70, 87, 65, 8, 174, 214, 157, 175, 126, 98, 90, 54, 24, 100, 177,
        247, 77, 19, 112, 47, 44, 165, 109, 233, 102, 14, 86, 109, 29, 134, 145,
        132, 141,
      ]),
    );
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
    // TODO: Create token account
    this.userTokenKeys = this.userTokenKeys ?? {};
    this.userTokenKeys[token] = new PublicKey(address);
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
