import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import type { ConfirmOptions } from "@solana/web3.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { Env } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import * as bip39 from "bip39";
import Decimal from "decimal.js";
import { derivePath } from "ed25519-hd-key";
import { ethers } from "ethers";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; // eslint-disable-line import/extensions

import type { Config, EcosystemId, EvmSpec, TokenConfig } from "./config";
import { CONFIGS, Protocol } from "./config";
import { Erc20Factory } from "./models";

import "dotenv/config"; // eslint-disable-line import/extensions

type CliOptions = Awaited<ReturnType<typeof parseCliOptions>>;

// Get tokens and chains configs
const ENV = Env.Devnet;
const { tokens, chains }: Config = CONFIGS[ENV];
const DEVNET_GAS_TOKENS = Object.values(chains)
  .flat()
  .map(
    ({ ecosystem }: { readonly ecosystem: EcosystemId }) =>
      `devnet-${ecosystem}-gas`,
  );

const TOKEN_CHOICES = [
  ...tokens.map(({ id }: TokenConfig) => id),
  ...DEVNET_GAS_TOKENS,
];

const sample = <T>(arr: ReadonlyArray<T>) =>
  arr[(Math.random() * arr.length) >> 0];

async function transferOnEvm(args: CliOptions) {
  const tokenId = args.token;
  const receiverAddress = args.receiverAddress;
  const amount = args.amount;

  const tokenConfig = findOrThrow(
    tokens,
    ({ id }: TokenConfig) => id === tokenId,
  );

  // Get a token contract
  const chainSpec = findOrThrow(
    chains[Protocol.Evm],
    ({ ecosystem }: EvmSpec) => ecosystem === tokenConfig.nativeEcosystemId,
  );

  const rpcUrl = sample(chainSpec.rpcUrls);
  console.info(`Using ${rpcUrl} JSON RPC.`);

  const evmProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // Hippo wallet (dev bank)
  const mnemonic = process.env.DEVNET_WALLET_EVM_MNEMONIC_PHRASE;

  if (mnemonic === undefined) {
    throw new Error("Mnemonic is required but missing.");
  }

  const senderWallet = ethers.Wallet.fromMnemonic(mnemonic.trim()).connect(
    evmProvider,
  );

  // Get a token contract address
  const contractAddress = tokenConfig.nativeDetails.address;
  const tokenContract = Erc20Factory.connect(contractAddress, senderWallet);

  console.info(
    `Attempting to send ${amount.toString()} ${tokenConfig.projectId} on ${
      tokenConfig.nativeEcosystemId
    } (${contractAddress}) from ${senderWallet.address} to ${receiverAddress}`,
  );

  const senderTokenBalance = ethers.utils.formatUnits(
    await tokenContract.balanceOf(senderWallet.address),
  );
  const gasTokensBalanceInWei = await evmProvider.getBalance(
    senderWallet.address,
  );
  console.info(
    `Sender (${senderWallet.address}) has ${senderTokenBalance} ${
      tokenConfig.projectId
    }. Gas tokens balance: ${ethers.utils.formatUnits(gasTokensBalanceInWei)}`,
  );

  // Convert to ERC20 decimals
  const numberOfTokens = ethers.utils.parseUnits(
    amount.toString(),
    tokenConfig.nativeDetails.decimals,
  );

  const tx = await tokenContract.transfer(receiverAddress, numberOfTokens);
  console.info(`Transaction ID: ${tx.hash}.`);

  const txReceipt = await tx.wait();
  const txStatus = txReceipt.status?.toString() || "N/A";
  console.info(
    `Transaction status: ${txStatus}. Gas used: ${txReceipt.gasUsed.toNumber()}`,
  );

  console.info(
    `Balance after. Sender: ${ethers.utils.formatUnits(
      await tokenContract.balanceOf(senderWallet.address),
    )} ${tokenConfig.projectId}. Receiver: ${ethers.utils.formatUnits(
      await tokenContract.balanceOf(receiverAddress),
    )} ${tokenConfig.projectId}. Gas tokens: ${ethers.utils.formatUnits(
      await evmProvider.getBalance(senderWallet.address),
    )}`,
  );
}

async function transferOnSolana(args: CliOptions) {
  async function getTokenAccountBalance(
    tokenAddress: PublicKey,
  ): Promise<string> {
    const tokenBalance = await solanaConnection.getTokenAccountBalance(
      tokenAddress,
    );

    const decimal = new Decimal(tokenBalance.value.amount).div(
      Decimal.pow(10, tokenBalance.value.decimals),
    );

    return decimal.toString();
  }

  const receiverAddress = new PublicKey(args.receiverAddress);

  const tokenId = args.token;
  const tokenConfig = findOrThrow(
    tokens,
    ({ id }: TokenConfig) => id === tokenId,
  );

  const amount = args.amount;

  const rpcUrl = clusterApiUrl("devnet");

  const confirmOptions: ConfirmOptions = {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  };

  // Initialize a Solana Connection
  const solanaConnection = new Connection(rpcUrl, confirmOptions);

  // Gather required keys
  // Hippo dev
  const mnemonic = process.env.DEVNET_WALLET_SOLANA_MNEMONIC_PHRASE;

  if (mnemonic === undefined) {
    throw new Error("Mnemonic is required but missing.");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic, "");
  const path = `m/44'/501'/0'/0'`;
  const fromWallet = Keypair.fromSeed(
    derivePath(path, seed.toString("hex")).key,
  );

  console.info(
    `User wallet public key: ${path} => ${fromWallet.publicKey.toBase58()}`,
  );

  // Get a token contract address
  const tokenContractAddress = new PublicKey(tokenConfig.nativeDetails.address);

  console.info(
    `Attempting to send ${amount} ${
      tokenConfig.projectId
    } on ${tokenConfig.nativeEcosystemId.toString()} (${tokenContractAddress.toString()}) from ${fromWallet.publicKey.toString()} to ${receiverAddress.toString()}`,
  );

  const fromToken = new Token(
    solanaConnection,
    tokenContractAddress,
    TOKEN_PROGRAM_ID,
    fromWallet,
  );
  const fromTokenAccount = await fromToken.getOrCreateAssociatedAccountInfo(
    fromWallet.publicKey,
  );

  const toTokenAccount = await fromToken.getOrCreateAssociatedAccountInfo(
    receiverAddress,
  );

  // Check account balance
  const balance = await solanaConnection.getBalance(fromWallet.publicKey);
  // Convert lamports to SOL
  const senderSolBalance = new Decimal(balance).dividedBy(LAMPORTS_PER_SOL);

  console.info(
    `Sender (${fromWallet.publicKey.toString()}) has ${await getTokenAccountBalance(
      fromTokenAccount.address,
    )} ${
      tokenConfig.projectId
    }. Gas tokens balance: ${senderSolBalance.toString()}`,
  );

  const txSignature = await fromToken.transfer(
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet,
    [fromWallet],
    new Decimal(args.amount)
      .mul(Decimal.pow(10, tokenConfig.nativeDetails.decimals))
      .toNumber(),
  );

  console.info(`Transaction signature: ${txSignature}.`);

  const newBalance = new Decimal(
    await solanaConnection.getBalance(fromWallet.publicKey),
  ).dividedBy(LAMPORTS_PER_SOL);

  console.info(
    `Balance after. Sender: ${await getTokenAccountBalance(
      fromTokenAccount.address,
    )} ${tokenConfig.projectId}. Receiver: ${await getTokenAccountBalance(
      toTokenAccount.address,
    )} ${tokenConfig.projectId}. Gas tokens: ${newBalance.toString()}`,
  );
}

async function transferGasOnEvm(args: CliOptions) {
  const tokenId = args.token;
  const receiverAddress = args.receiverAddress;
  const amount = args.amount;

  // Hippo wallet (dev bank)
  const mnemonic = process.env.DEVNET_WALLET_EVM_MNEMONIC_PHRASE;

  if (mnemonic === undefined) {
    throw new Error("Mnemonic is required but missing.");
  }

  // Get a chain RPC URL
  const chainSpec = findOrThrow(
    chains[Protocol.Evm],
    ({ ecosystem }: EvmSpec) => tokenId.includes(ecosystem),
  );

  const rpcUrl = sample(chainSpec.rpcUrls);
  console.info(`Using ${rpcUrl} JSON RPC.`);

  const evmProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const senderWallet = ethers.Wallet.fromMnemonic(mnemonic.trim()).connect(
    evmProvider,
  );

  const senderTokenBalance = ethers.utils.formatUnits(
    await senderWallet.getBalance(),
  );

  console.info(
    `Sender (${senderWallet.address}) has ${senderTokenBalance} on ${chainSpec.chainName}.`,
  );

  const txResponse = await senderWallet.sendTransaction({
    to: receiverAddress,
    value: ethers.utils.parseEther(amount),
  });

  console.info(`Transaction ID: ${txResponse.hash}.`);

  const txReceipt = await txResponse.wait();
  const txStatus = txReceipt.status?.toString() || "N/A";
  console.info(
    `Transaction status: ${txStatus}. Gas used: ${txReceipt.gasUsed.toNumber()}`,
  );

  console.info(
    `Balance after. Sender: ${ethers.utils.formatUnits(
      await senderWallet.getBalance(),
    )}. Receiver: ${ethers.utils.formatUnits(
      await evmProvider.getBalance(receiverAddress),
    )}. Gas tokens: ${ethers.utils.formatUnits(
      await evmProvider.getBalance(senderWallet.address),
    )}`,
  );
}

async function transferGasOnSolana(args: CliOptions) {
  const receiverAddress = new PublicKey(args.receiverAddress);

  const amount = args.amount;

  const rpcUrl = clusterApiUrl("devnet");

  const confirmOptions: ConfirmOptions = {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  };

  // Initialize a Solana Connection
  const solanaConnection = new Connection(rpcUrl, confirmOptions);

  console.info(
    `Attempting to send ${amount} SOL on Solana to ${receiverAddress.toString()}`,
  );

  const txSignature = await solanaConnection.requestAirdrop(
    receiverAddress,
    new Decimal(amount).mul(LAMPORTS_PER_SOL).toNumber(),
  );

  const latestBlockhash = await solanaConnection.getLatestBlockhash();
  await solanaConnection.confirmTransaction({
    ...latestBlockhash,
    signature: txSignature,
  });

  console.info(`Transaction signature: ${txSignature}.`);

  const newBalance = new Decimal(
    await solanaConnection.getBalance(receiverAddress),
  ).dividedBy(LAMPORTS_PER_SOL);

  console.info(`SOL balance: ${newBalance.toString()}`);
}

async function parseCliOptions() {
  return yargs(hideBin(process.argv))
    .scriptName("airdrop")
    .usage("$0 [args]")
    .option("token", {
      type: "string",
      choices: TOKEN_CHOICES,
      demandOption: true,
    })
    .option("receiverAddress", {
      type: "string",
      alias: "to",
      demandOption: true,
    })
    .option("amount", {
      type: "string",
      default: "1",
    })
    .check((argv) => {
      const { token: tokenId, receiverAddress } = argv;
      const foundToken = TOKEN_CHOICES.find((id) => id === tokenId);

      if (!foundToken) {
        throw new Error(`Token ${tokenId} not found.`);
      }

      if (
        ethers.utils.isAddress(receiverAddress) ||
        PublicKey.isOnCurve(new PublicKey(receiverAddress))
      ) {
        return true;
      } else {
        throw new Error(`Receiver address ${receiverAddress} does not exist.`);
      }
    })
    .help()
    .parse();
}

async function main() {
  const args = await parseCliOptions();
  const token = args.token;

  if (!token.startsWith("devnet-solana-")) {
    if (DEVNET_GAS_TOKENS.includes(token)) {
      await transferGasOnEvm(args);
    } else {
      await transferOnEvm(args);
    }
  } else {
    if (DEVNET_GAS_TOKENS.includes(token)) {
      await transferGasOnSolana(args);
    } else {
      await transferOnSolana(args);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
