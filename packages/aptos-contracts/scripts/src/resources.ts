/* eslint-disable no-console */
import { AptosClient, AptosAccount, CoinClient } from "aptos";
import { NODE_URL } from "./common";

(async () => {
  const accountAddress = process.env.ACCOUNT;

  if (!accountAddress) {
    console.error(`process env ACCOUNT is required`);
    process.exit(1);
  }

  const client = new AptosClient(NODE_URL);
  const account = new AptosAccount(undefined, accountAddress);
  const resources = await client.getAccountResources(account.address());

  console.log("=== Address ===");
  console.log(account.address());

  // Print out initial balances.
  console.log("=== Resources ===");
  console.log(JSON.stringify(resources, null, 4));
})();
