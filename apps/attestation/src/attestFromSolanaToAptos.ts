import {
  CHAINS,
  attestFromSolana,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
  parseSequenceFromLogSolana,
  setDefaultWasm,
} from "@certusone/wormhole-sdk";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { aptos } from "@swim-io/aptos";
import { Env, wormholeConfigs } from "@swim-io/core";
import { solana } from "@swim-io/solana";
// using an older version of @swim-io/solana which doesn't include wallet adapters due to this error (es6 code in a commonjs module)
// import statement inside a commonjs module?
// Users/nico/Code/swim/swim/apps/attestation/node_modules/@swim-io/solana/node_modules/@project-serum/sol-wallet-adapter/dist/cjs/index.js:79
// import EventEmitter from 'eventemitter3';
// ^^^^^^
// SyntaxError: Cannot use import statement outside a module
import { AptosAccount } from "aptos";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; // eslint-disable-line import/extensions

import { createWrappedCoin } from "./attestAptos";

import "dotenv/config"; // eslint-disable-line import/extensions

setDefaultWasm("node");

async function main() {
  const args = await parseCliOptions();
  const mintAddress = args.mintAddress;
  const env = Env.Devnet;
  const aptosNetwork = "TESTNET";
  const solanaNetwork = "devnet";
  const solanaRpcUrl = clusterApiUrl(solanaNetwork); // TODO we probably need to pass our own provider here
  const aptosRpcUrl = "https://fullnode.devnet.aptoslabs.com/v1";

  console.table({
    mintAddress,
    env,
    solanaNetwork,
    solanaRpcUrl,
    aptosNetwork,
    aptosRpcUrl,
  });

  const solanaMnemonic = process.env.WALLET_SOLANA_MNEMONIC_PHRASE;
  const aptosPrivateKey = process.env.APTOS_ACCOUNT_PRIVATE_KEY;
  const solanaChainConfig = solana.chains.get(env);
  const aptosChainConfig = aptos.chains.get(env);
  const wormholeConfig = wormholeConfigs.get(env);

  if (!solanaChainConfig)
    throw new Error(`No SolanaChainConfig found for env: ${env}`);
  if (!aptosChainConfig)
    throw new Error(`No AptosChainConfig found for env: ${env}`);
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

  // TODO switch to the SDK method when it gets published
  // See https://github.com/wormhole-foundation/wormhole/blob/65ce4cd2dbda4aeb6bbc9ab1ca5a085815f11387/sdk/js/src/aptos/api/tokenBridge.ts#L111
  const wrappedCoinTx = await createWrappedCoin({
    sender,
    nodeUrl: aptosRpcUrl,
    tokenChain: CHAINS.solana,
    tokenAddress: toHex(mintAddress),
    tokenBridgeAddress: aptosChainConfig.wormhole.bridge,
    vaa: vaaBytes,
  });

  console.info("wrappedCoinTx", wrappedCoinTx);
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

function toHex(str: string) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}
