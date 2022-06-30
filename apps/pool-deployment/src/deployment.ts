import { readFileSync } from "fs";
import {
  PublicKey,
  Keypair,
  Signer,
  ConfirmOptions,
  Connection,
} from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import {
  //getPoolState,
  PoolInstructor,
  secretToKeypair,
  Decimal,
} from "@swim-io/pool-sdk";

async function createStableMints(
  connection: Connection,
  payer: Signer,
  decimals: readonly number[],
): Promise<readonly PublicKey[]> {
  return Promise.all(
    decimals.map((dec) =>
      createMint(connection, payer, payer.publicKey, payer.publicKey, dec),
    ),
  );
}

async function main() {
  const config = JSON.parse(readFileSync("config.json", "utf-8"));
  const payer = secretToKeypair(
    JSON.parse(readFileSync(config.walletSecretJsonFile, "utf-8")),
  );
  const confirmOptions: ConfirmOptions = {
    commitment: "finalized",
    preflightCommitment: "finalized",
  };
  const connection = new Connection(config.rpcUrl, confirmOptions);

  const swimMintKey = new PublicKey("replace with swim mint address"); //TODO
  const xSwimDecimals = 6; //TODO this should probably match SWIM decimals
  const ampFactor = new Decimal(1); //irrelevant
  const lpFee = new Decimal(0); //no fees
  const governanceFee = new Decimal(0); //no fees

  const swimLakeStateKeys = Keypair.generate(); //set manually if you want to have a special key pair
  const xSwimKeys = Keypair.generate(); //set manually if ...

  console.log(`swimLake state address: ${swimLakeStateKeys.publicKey}`);
  console.log(`xSwim mint address: ${xSwimKeys.publicKey}`);

  try {
    await PoolInstructor.deployPool(
      connection,
      payer,
      [swimMintKey],
      payer.publicKey,
      xSwimDecimals,
      ampFactor,
      lpFee,
      governanceFee,
      swimLakeStateKeys,
      xSwimKeys,
    );

    //print hexapool mainnet state
    //console.log(JSON.stringify(await getPoolState(connection, new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma")), null, 2));

    console.log("successfully deployed");
  } catch (error) {
    console.error(`deployment failed with error: ${error}`);
  }
}

main();
