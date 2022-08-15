const fs = require("fs/promises");
const path = require("path");

import { Env } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import { ethers } from "ethers";

import type { Config, EvmSpec, TokenSpec } from "./config";
import { CONFIGS, Protocol } from "./config";
import { Erc20Factory, EvmConnection } from "./models/evm";

const ENV = Env.Devnet;

async function main() {
  // TODO: Get from cli arg
  const tokenId = "devnet-fantom-usdc";

  // TODO: Get from cli arg
  const receiverAddress = "0xdf9Fb66F089A2c64C74B0B7D750CB661947Efa28";

  // TODO: Get from cli arg
  const amount = 1;

  // Get tokens and chains configs
  const { tokens, chains }: Config = CONFIGS[ENV];
  const tokenSpec = findOrThrow(tokens, ({ id }: TokenSpec) => id === tokenId);

  // Get a token contract
  const chainSpec = findOrThrow(
    chains[Protocol.Evm] as EvmSpec[],
    ({ ecosystem }: EvmSpec) => ecosystem === tokenSpec.nativeEcosystemId,
    );

    const evmProvider = EvmConnection.getIndexerProvider(ENV, chainSpec);

  // Hippo wallet (dev bank)
  const mnemonic = process.env.DEVNET_MNEMONIC_PHRASE;
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

  const senderTokenBalance = await tokenContract.balanceOf(
    senderWallet.address,
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
    `Balance after. Sender: ${await tokenContract.balanceOf(
      senderWallet.address,
    )} ${tokenSpec.projectId}. Receiver: ${await tokenContract.balanceOf(
      receiverAddress,
    )} ${tokenSpec.projectId}. Gas tokens: ${ethers.utils.formatUnits(
      await evmProvider.getBalance(senderWallet.address),
    )}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
