/* eslint-disable no-console */
import { AptosClient, AptosAccount, CoinClient } from "aptos";
import { NODE_URL } from "./common";

(async () => {
  const accountAddress = process.env.ACCOUNT!;
  const coinType = process.env.COIN_TYPE!;

  if (!accountAddress || !coinType) {
    console.error(`process env ACCOUNT and COIN_TYPE are required`);
    process.exit(1);
  }

  const client = new AptosClient(NODE_URL);
  const coinClient = new CoinClient(client); // <:!:section_1a
  const account = new AptosAccount(undefined, accountAddress);

  console.log("=== Address ===");
  console.log(account.address());

  // Print out initial balances.
  console.log("=== Balance ===");
  console.log(
    `Balance for coin ${coinType}: ${await coinClient.checkBalance(account, {
      coinType,
    })}`,
  );
})();
