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
  const tokenId = "devnet-ethereum-usdc";

  // TODO: Get from cli arg
  // Hippo wallet (dev bank)
  const receiverAddress = "0x866450d3256310D51Ff3aac388608e30d03d7841";

  // TODO: Get from cli arg
  const amount = 1 / 10e5;

  // Get tokens and chains configs
  const { tokens, chains }: Config = CONFIGS[ENV];
  const tokenSpec = findOrThrow(tokens, ({ id }: TokenSpec) => id === tokenId);

  // Get a token contract
  const chainSpec = findOrThrow(
    chains[Protocol.Evm] as EvmSpec[],
    ({ ecosystem }: EvmSpec) => ecosystem === tokenSpec.nativeEcosystemId,
  );

  const evmProvider = EvmConnection.getIndexerProvider(ENV, chainSpec);

  // Read devnet bank wallet from mnemonic
  const mnemonicPath = path.resolve(
    "../ui/src/keys/wallet-accounts/0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1.txt",
  );
  const mnemonic = await fs.readFile(mnemonicPath, "utf-8");
  const senderWallet = ethers.Wallet.fromMnemonic(mnemonic.trim()).connect(evmProvider);

  // Convert to ERC20 decimals
  const numberOfTokens = ethers.utils.parseUnits(
    amount.toString(),
    tokenSpec.nativeDetails.decimals,
  );

  // Get a token contract address
  const contractAddress = tokenSpec.nativeDetails.address;
  console.log(
    `Attempting to send ${numberOfTokens.toString()} ${tokenSpec.projectId
    } on ${tokenSpec.nativeEcosystemId} (${contractAddress}) from ${senderWallet.address
    } to ${receiverAddress}`,
  );

  const tokenContract = Erc20Factory.connect(contractAddress, senderWallet);

  const txReceipt = await tokenContract.transfer(
    receiverAddress,
    numberOfTokens,
  );
  const txId = await txReceipt.wait();
  console.log(`Transaction ID: ${txId.transactionHash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
