import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { CHAINS, SALTS } from "../src/config";
import { deploySwimFactory, deployLogic, deployProxy, deployPoolAndRegister } from "../src/deploy";

async function main() {
  const chainId = (await ethers.provider.detectNetwork()).chainId;

  const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
  if (!chainConfig) throw Error("Network with chainId " + chainId + " not implemented yet");

  console.log("executing deployment script for", chainConfig.name);

  const [deployer, governance, governanceFeeRecipient] = await ethers.getSigners();

  dotenv.config();
  await deploySwimFactory(deployer, process.env.FACTORY_MNEMONIC);
  const routingLogic = await deployLogic("Routing", SALTS.routingLogic);
  await deployLogic("LpToken", SALTS.lpToken);
  const poolLogic = await deployLogic("Pool", SALTS.poolLogic);
  const routingProxy = await deployProxy(
    routingLogic,
    SALTS.routingProxy,
    [deployer.address, chainConfig.wormholeTokenBridge]
  );

  for (const pool of chainConfig.pools)
    await deployPoolAndRegister(pool, poolLogic, routingProxy, governance, governanceFeeRecipient);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
