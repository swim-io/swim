import {
  CHAINS,
  attestFromSolana,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
  parseSequenceFromLogSolana,
  setDefaultWasm,
} from "@certusone/wormhole-sdk";
import {
  createWrappedCoin,
  createWrappedCoinType,
} from "@certusone/wormhole-sdk/lib/cjs/aptos/index.js"; // TODO import these from root when published
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { aptos } from "@swim-io/aptos";
import { Env, wormholeConfigs } from "@swim-io/core";
import { solana } from "@swim-io/solana";
import type { Types } from "aptos";
import { AptosAccount, AptosClient } from "aptos";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; // eslint-disable-line import/extensions

import "dotenv/config"; // eslint-disable-line import/extensions

setDefaultWasm("node");

async function main() {
  const args = await parseCliOptions();
  const mintAddress = args.mintAddress;
  const env = Env.Testnet;
  const solanaNetwork = "devnet";
  const solanaRpcUrl = clusterApiUrl(solanaNetwork); // TODO we probably need to pass our own provider here
  const aptosChainConfig = aptos.chains[env];
  const aptosRpcUrl = aptosChainConfig.publicRpcUrls[0];

  console.table({
    mintAddress,
    env,
    solanaNetwork,
    solanaRpcUrl,
    aptosRpcUrl,
  });

  const solanaMnemonic = process.env.WALLET_SOLANA_MNEMONIC_PHRASE;
  const aptosPrivateKey = process.env.APTOS_ACCOUNT_PRIVATE_KEY;
  const solanaChainConfig = solana.chains[env];
  const wormholeConfig = wormholeConfigs.get(env);

  if (!wormholeConfig)
    throw new Error(`No WormholeConfig found for env: ${env}`);
  if (!solanaMnemonic)
    throw new Error(
      "env variable WALLET_SOLANA_MNEMONIC_PHRASE is required but missing.",
    );
  if (!aptosPrivateKey)
    throw new Error(
      "env variable APTOS_ACCOUNT_PRIVATE_KEY is required but missing.",
    );

  const seed = await bip39.mnemonicToSeed(solanaMnemonic, "");
  const path = `m/44'/501'/0'/0'`;
  const fromWallet = Keypair.fromSeed(
    derivePath(path, seed.toString("hex")).key,
  );

  const connection = new Connection(solanaRpcUrl, "confirmed");
  const transaction = await attestFromSolana(
    connection,
    solanaChainConfig.wormhole.bridge,
    solanaChainConfig.wormhole.portal,
    fromWallet.publicKey.toBase58(),
    mintAddress,
  );

  transaction.partialSign(fromWallet);
  const signedAndSerialized = transaction.serialize();

  console.info("Sending Attestation transaction");
  const txId = await connection.sendRawTransaction(signedAndSerialized);
  console.info("Attestation txId", txId);

  const {
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext();
  await connection.confirmTransaction({
    signature: txId,
    blockhash,
    lastValidBlockHeight,
  });

  // Get the sequence number and emitter address required to fetch the signedVAA of our message
  // Using the deprecated signature due to `parseSequenceFromLogSolana` arg type.
  // eslint-disable-next-line deprecation/deprecation
  const info = await connection.getTransaction(txId, {
    commitment: "confirmed",
  });

  if (!info)
    throw new Error(
      `Failed to get attestFromSolana transaction info. txId: ${txId}`,
    );

  const sequence = parseSequenceFromLogSolana(info);
  const emitterAddress = await getEmitterAddressSolana(
    solanaChainConfig.wormhole.portal,
  );

  console.info(
    `Fetching signed VAA. emitterAddress is ${emitterAddress} and sequence is ${sequence}`,
  );
  console.info("This might take a while. Please wait.");

  const { vaaBytes } = await getSignedVAAWithRetry(
    [...wormholeConfig.rpcUrls],
    CHAINS.solana,
    emitterAddress,
    sequence,
  );

  console.info(`Fetched signed VAA. vaaBytes: ${vaaBytes.toString()}`);

  const sender = new AptosAccount(
    new Uint8Array(Buffer.from(aptosPrivateKey, "hex")),
  );

  const client = new AptosClient(aptosRpcUrl);

  const createWrappedCoinTypePayload = createWrappedCoinType(
    aptosChainConfig.wormhole.bridge,
    vaaBytes,
  );
  console.info("createWrappedCoinTypePayload", createWrappedCoinTypePayload);
  const createWrappedCoinTypeTx = await executeEntryFunction(
    client,
    sender,
    createWrappedCoinTypePayload,
  );
  console.info("createWrappedCoinTypeTx", createWrappedCoinTypeTx);

  const createWrappedCoinPayload = createWrappedCoin(
    aptosChainConfig.wormhole.bridge,
    vaaBytes,
  );
  console.info("createWrappedCoinPayload", createWrappedCoinPayload);
  console.info(
    `The address of the attested token is ${createWrappedCoinPayload.type_arguments[0]}`,
  );
  const createWrappedCoinTx = await executeEntryFunction(
    client,
    sender,
    createWrappedCoinPayload,
  );
  console.info("createWrappedCoinTx", createWrappedCoinTx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function parseCliOptions() {
  return yargs(hideBin(process.argv))
    .scriptName("attestFromSolanaToAptos")
    .usage("$0 [args]")
    .option("mintAddress", {
      type: "string",
      demandOption: true,
    })
    .help()
    .parse();
}

async function executeEntryFunction(
  client: AptosClient,
  sender: AptosAccount,
  payload: Types.EntryFunctionPayload,
  opts?: Partial<Types.SubmitTransactionRequest>,
): Promise<string> {
  const rawTx = await client.generateTransaction(sender.address(), payload, {
    ...opts,
  });

  // first simulate tx to see if something is obviously wrong
  const simulatedTxs = await client.simulateTransaction(sender, rawTx);
  simulatedTxs.forEach((tx) => {
    if (!tx.success) {
      console.error(JSON.stringify(tx, null, 2));
      throw new Error(`Transaction simulation failed: ${tx.vm_status}`);
    }
  });

  // sign & submit transaction if simulation is successful
  const signedTx = await client.signTransaction(sender, rawTx);
  const pendingTx = await client.submitTransaction(signedTx);
  await client.waitForTransaction(pendingTx.hash);
  return pendingTx.hash;
}
