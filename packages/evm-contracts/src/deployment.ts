import * as dotenv from "dotenv";
import { ethers } from "hardhat";

import { CHAINS, DEFAULTS, FACTORY_PRESIGNED, SALTS, TOKEN_NUMBERS } from "../src/config";
import {
  deployRegular,
  deployLogic,
  deployPoolAndRegister,
  deployProxy,
  deploySwimFactory,
  deployToken,
} from "./deploy";

export async function deployment() {
  const chainId = (await ethers.provider.detectNetwork()).chainId;

  const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);

  console.log("executing deployment script for", chainConfig.name);

  const [deployer, governance, governanceFeeRecipient] = await ethers.getSigners();

  dotenv.config();
  await deploySwimFactory(
    deployer,
    process.env.FACTORY_MNEMONIC,
    FACTORY_PRESIGNED[chainId as keyof typeof FACTORY_PRESIGNED] as {
      readonly from: string;
      readonly maxCost: string;
      readonly signedTx: string;
    }
  );

  const wormholeTokenBridge = await (async () => {
    if (chainConfig.wormholeTokenBridge !== "MOCK") return chainConfig.wormholeTokenBridge;

    const swimUsd = await deployToken(DEFAULTS.swimUsd, deployer);
    return (await deployRegular("MockTokenBridge", [swimUsd.address])).address;
  })();

  await deployLogic("LpToken");
  await deployLogic("Routing");
  await deployLogic("Pool");
  await deployProxy("Routing", [deployer.address, wormholeTokenBridge]);

  const dynamicallyDeployedTokens = (
    await Promise.all(
      (chainConfig.tokens ?? []).map(async (token) => ({
        [token.symbol]: (await deployToken(token, deployer)).address,
      }))
    )
  ).reduce((acc, token) => ({ ...acc, ...token }), {});

  for (const pool of chainConfig.pools ?? []) {
    const poolTokens = pool.tokens.map((token) =>
      typeof token === "string"
        ? {
            address: dynamicallyDeployedTokens[token],
            tokenNumber: TOKEN_NUMBERS[token as keyof typeof TOKEN_NUMBERS],
          }
        : token
    );
    const poolFixedTokens = { ...pool, tokens: poolTokens };
    await deployPoolAndRegister(
      poolFixedTokens,
      governance,
      governanceFeeRecipient
    );
  }
  console.log("deployment complete");
}
