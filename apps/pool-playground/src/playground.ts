import { readFileSync } from "fs";
import { PublicKey, ConfirmOptions, Connection } from "@solana/web3.js";
import {
  getPoolState,
  //PoolInstructor,
  secretToKeypair,
  //Decimal,
 } from "@swim-io/pool-sdk";

async function main() {
  //const rpcUrl = "https://api.devnet.solana.com";
  const rpcUrl = "https://free.rpcpool.com";
  const config = JSON.parse(readFileSync("config.json", "utf-8"));
  const payer = secretToKeypair(JSON.parse(readFileSync("my_secret.json", "utf-8")));
  const confirmOptions: ConfirmOptions = { commitment: "finalized", preflightCommitment: "finalized" };
  const connection = new Connection(config.rpcUrl, confirmOptions);

  try {
    //get and print hexapool mainnet state
    const poolState = await getPoolState(connection, new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"));
    console.log(JSON.stringify(poolState), null, 2);

  }
  catch (error) {
    console.error(`playground failed with error: ${error}`)
  }
}

main();
