import * as dotenv from "dotenv";
import { ethers } from "hardhat";

import { CHAINS } from "../src/config";
import { deployment } from "../src/deployment";

(async () => {
  dotenv.config();
  const chainId = (await ethers.provider.detectNetwork()).chainId;

  const chainConfig = CHAINS[chainId];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);

  await deployment(chainConfig, { factoryMnemonic: process.env.FACTORY_MNEMONIC, print: true });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
