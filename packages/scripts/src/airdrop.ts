import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { ethers } from "ethers";
import {
  Connection,
  PublicKey,
  ConfirmOptions,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Decimal from "decimal.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";

import { Env } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";

import type { Config, EvmSpec, SolanaSpec, TokenSpec } from "./config";
import { CONFIGS, Protocol } from "./config";
import { Erc20Factory, EvmConnection } from "./models";

import "dotenv/config";

type CliOptions = Awaited<ReturnType<typeof parseCliOptions>>;

async function transferOnEvm(args: CliOptions) {
  const tokenId = args.token;
  const receiverAddress = args.receiverAddress;
  const amount = args.amount;

  const tokenSpec = findOrThrow(tokens, ({ id }: TokenSpec) => id === tokenId);

  // Get a token contract
  const chainSpec = findOrThrow(
    chains[Protocol.Evm],
    ({ ecosystem }: EvmSpec) => ecosystem === tokenSpec.nativeEcosystemId,
  );

  const evmProvider = EvmConnection.getIndexerProvider(ENV, chainSpec);

  // Hippo wallet (dev bank)
  const mnemonic =
    "track hybrid update chat play mimic warrior ozone liquid empower knee resist";
  const senderWallet = ethers.Wallet.fromMnemonic(mnemonic.trim()).connect(
    evmProvider,
  );

  // Get a token contract address
  const contractAddress = tokenSpec.nativeDetails.address;
  const tokenContract = Erc20Factory.connect(contractAddress, senderWallet);

  console.log(
    `Attempting to send ${amount.toString()} ${tokenSpec.projectId} on ${
      tokenSpec.nativeEcosystemId
    } (${contractAddress}) from ${senderWallet.address} to ${receiverAddress}`,
  );

  const senderTokenBalance = ethers.utils.formatUnits(
    await tokenContract.balanceOf(senderWallet.address),
  );
  const gasTokensBalanceInWei = await evmProvider.getBalance(
    senderWallet.address,
  );
  console.log(
    `Sender (${senderWallet.address}) has ${senderTokenBalance} ${
      tokenSpec.projectId
    }. Gas tokens balance: ${ethers.utils.formatUnits(gasTokensBalanceInWei)}`,
  );

  // Convert to ERC20 decimals
  const numberOfTokens = ethers.utils.parseUnits(
    amount.toString(),
    tokenSpec.nativeDetails.decimals,
  );

  const txReceipt = await (
    await tokenContract.transfer(receiverAddress, numberOfTokens)
  ).wait();
  console.log(
    `Transaction completed with ${txReceipt.status} status. ID: ${txReceipt.transactionHash}. Gas used: ${txReceipt.gasUsed}`,
  );

  console.log(
    `Balance after. Sender: ${ethers.utils.formatUnits(
      await tokenContract.balanceOf(senderWallet.address),
    )} ${tokenSpec.projectId}. Receiver: ${ethers.utils.formatUnits(
      await tokenContract.balanceOf(receiverAddress),
    )} ${tokenSpec.projectId}. Gas tokens: ${ethers.utils.formatUnits(
      await evmProvider.getBalance(senderWallet.address),
    )}`,
  );
}

async function transferOnSolana(args: CliOptions) {
  async function getTokenAccountBalance(
    tokenAddress: PublicKey,
  ): Promise<Decimal> {
    const tokenBalance = await solanaConnection.getTokenAccountBalance(
      tokenAddress,
    );

    return new Decimal(tokenBalance.value.amount).div(
      Decimal.pow(10, tokenBalance.value.decimals),
    );
  }

  const receiverAddress = new PublicKey(args.receiverAddress);

  const tokenId = args.token;
  const tokenSpec = findOrThrow(tokens, ({ id }: TokenSpec) => id === tokenId);

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
  const mnemonic =
    "under pond submit fix spoon chef always picture ugly farm helmet stable loud morning drastic swap appear wrong define clump donkey expand buyer ski";
  const seed = await bip39.mnemonicToSeed(mnemonic, "");
  const path = `m/44'/501'/0'/0'`;
  const fromWallet = Keypair.fromSeed(
    derivePath(path, seed.toString("hex")).key,
  );

  console.log(
    `User wallet public key: ${path} => ${fromWallet.publicKey.toBase58()}`,
  );

  // Get a token contract address
  const tokenContractAddress = new PublicKey(tokenSpec.nativeDetails.address);

  console.log(
    `Attempting to send ${amount} ${
      tokenSpec.projectId
    } on ${tokenSpec.nativeEcosystemId.toString()} (${tokenContractAddress.toString()}) from ${fromWallet.publicKey.toString()} to ${receiverAddress.toString()}`,
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

  console.log(
    `Sender (${fromWallet.publicKey.toString()}) has ${await getTokenAccountBalance(
      fromTokenAccount.address,
    )} ${
      tokenSpec.projectId
    }. Gas tokens balance: ${senderSolBalance.toString()}`,
  );

  const txSignature = await fromToken.transfer(
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet,
    [fromWallet],
    new Decimal(args.amount)
      .mul(Decimal.pow(10, tokenSpec.nativeDetails.decimals))
      .toNumber(),
  );

  console.log(`Transaction signature: ${txSignature}.`);

  const newBalance = new Decimal(
    await solanaConnection.getBalance(fromWallet.publicKey),
  ).dividedBy(LAMPORTS_PER_SOL);

  console.log(
    `Balance after. Sender: ${await getTokenAccountBalance(
      fromTokenAccount.address,
    )} ${tokenSpec.projectId}. Receiver: ${await getTokenAccountBalance(
      toTokenAccount.address,
    )} ${tokenSpec.projectId}. Gas tokens: ${newBalance.toString()}`,
  );
}

// Get tokens and chains configs
const ENV = Env.Devnet;
const { tokens, chains }: Config = CONFIGS[ENV];

async function parseCliOptions() {
  return yargs(hideBin(process.argv))
    .scriptName("airdrop")
    .usage("$0 [args]")
    .option("token", {
      type: "string",
      choices: tokens.map(({ id }: TokenSpec) => id),
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
    .check((argv, options) => {
      const { token: tokenId, receiverAddress } = argv;
      const tokenSpec = tokens.find(({ id }: TokenSpec) => id === tokenId);

      if (!tokenSpec) {
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

  const receiverAddress = args.receiverAddress;

  if (
    !args.token.startsWith("devnet-solana-") &&
    ethers.utils.isAddress(receiverAddress)
  ) {
    await transferOnEvm(args);
  } else if (
    args.token.startsWith("devnet-solana-") &&
    PublicKey.isOnCurve(new PublicKey(receiverAddress))
  ) {
    await transferOnSolana(args);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
