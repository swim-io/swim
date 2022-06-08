//import { readFileSync } from "fs";
import { PublicKey, ConfirmOptions, Connection } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import {
  getPoolState,
  //PoolInstructor,
  //secretToKeypair,
  Decimal,
 } from "@swim-io/pool-sdk";

const withDecimals = (value: bigint, decimals: number) =>
  new Decimal(value.toString()).div(new Decimal(10).pow(decimals));

async function main() {
  //const rpcUrl = "https://free.rpcpool.com"; //mainnet
  const rpcUrl = "https://api.devnet.solana.com"; //testnet

  //const poolStateKey = "8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"; //mainnet
  const poolStateKey = "B1SAcuHscDM6JozshK8mEWXGzpfVPeeFVkf98GRnoqiT"; //testnet

  //const payer = secretToKeypair(JSON.parse(readFileSync("my_secret.json", "utf-8")));
  const confirmOptions: ConfirmOptions = { commitment: "finalized", preflightCommitment: "finalized" };
  const connection = new Connection(rpcUrl, confirmOptions);

  try {
    //get and print hexapool state
    const poolState = await getPoolState(connection, new PublicKey(poolStateKey));
    const poolAccounts = await Promise.all(poolState.tokenKeys.map(key => getAccount(connection, key)));
    const lpMint = await getMint(connection, poolState.lpMintKey);

    const humanPoolBalances = poolAccounts.map((acc, i) =>
      withDecimals(acc.amount, lpMint.decimals - poolState.tokenDecimalEqualizers[i])
    );
    console.log("pool state:");
    console.log(JSON.stringify(poolState, null, 2));
    console.log("pool balances:");
    console.log(JSON.stringify(humanPoolBalances, null, 2));
    console.log("LP supply:");
    console.log(" ", withDecimals(lpMint.supply, lpMint.decimals));
    console.log("sum pool Balances:");
    console.log(" ", Decimal.sum(...humanPoolBalances));
  }
  catch (error) {
    console.error(`playground failed with error: ${error}`)
  }
}

main();
