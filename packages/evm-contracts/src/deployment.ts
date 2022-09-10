import { readFile } from "fs/promises";

import * as dotenv from "dotenv";
import { ethers } from "hardhat";

import {
  CHAINS,
  DEFAULTS,
  FACTORY_PRESIGNED,
  ROUTING_CONTRACT_SOLANA_ADDRESS,
  SWIM_FACTORY_ADDRESS,
  SWIM_USD_DECIMALS,
  SWIM_USD_SOLANA_ADDRESS,
  TOKEN_NUMBERS,
} from "./config";
import {
  deployLogic,
  deployPoolAndRegister,
  deployProxy,
  deployRegular,
  deploySwimFactory,
  deployToken,
  getLogicAddress,
  getProxyAddress,
} from "./deploy";

async function checkConstant(constantName: string, value: string) {
  //suboptimal, fragile way to check that hardcoded constants in config match those in contracts
  const contractName = "Constants";
  const filePath = "contracts/" + contractName + ".sol";
  const re = new RegExp(
    `constant\\s+${constantName}\\s*=[\\s\\w\\(]*([xa-fA-F0-9]{${value.length}})\\)*;`
  );
  const contractSource = await readFile(filePath, { encoding: "utf8" });
  const matches = contractSource.match(re);
  if (!matches)
    throw Error(`Failed to find constant ${constantName} in Solidity contract ${contractName}`);

  if (matches[1] !== value)
    throw Error(
      `Expected value ${value} for constant ${constantName} in Solidity contract ` +
        `${contractName} but found ${matches[1]} instead`
    );
}

export async function deployment(print = false) {
  const padding = 15;
  // eslint-disable-next-line no-console
  const log = print ? console.log : () => {};
  const chainId = (await ethers.provider.detectNetwork()).chainId;

  const chainConfig = CHAINS[chainId];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);

  log("executing deployment script for", chainConfig.name);

  await checkConstant("SWIM_USD_SOLANA_ADDRESS", SWIM_USD_SOLANA_ADDRESS);
  await checkConstant("SWIM_USD_DECIMALS", SWIM_USD_DECIMALS.toString());
  await checkConstant("ROUTING_CONTRACT_SOLANA_ADDRESS", ROUTING_CONTRACT_SOLANA_ADDRESS);
  await checkConstant("SWIM_FACTORY", SWIM_FACTORY_ADDRESS);

  const [deployer, governanceFeeRecipient] = await ethers.getSigners();
  log("deployer:", deployer.address);
  log("deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));

  dotenv.config();
  await deploySwimFactory(
    deployer,
    process.env.FACTORY_MNEMONIC,
    FACTORY_PRESIGNED[chainId as keyof typeof FACTORY_PRESIGNED]
  );

  log("SwimFactory:".padStart(padding), SWIM_FACTORY_ADDRESS);

  await checkConstant("ROUTING_CONTRACT", await getProxyAddress("Routing"));
  await checkConstant("LP_TOKEN_LOGIC", await getLogicAddress("LpToken"));

  const wormholeTokenBridge = await (async () => {
    if (chainConfig.wormholeTokenBridge !== "MOCK") return chainConfig.wormholeTokenBridge;

    const swimUsd = await deployToken(DEFAULTS.swimUsd, deployer);
    return (await deployRegular("MockTokenBridge", [swimUsd.address])).address;
  })();

  const lpLogic = await deployLogic("LpToken");
  log("LpLogic:".padStart(padding), lpLogic.address);
  log("RoutingLogic:".padStart(padding), (await deployLogic("Routing")).address);
  log("PoolLogic:".padStart(padding), (await deployLogic("Pool")).address);
  const routingProxy = await deployProxy("Routing", [deployer.address, wormholeTokenBridge]);

  log("RoutingProxy:".padStart(padding), routingProxy.address);

  const dynamicallyDeployedTokens = (
    await Promise.all(
      (chainConfig.tokens ?? []).map(async (token) => {
        const tokenAddress = (await deployToken(token, deployer)).address;
        log((token.symbol + ":").padStart(padding), tokenAddress);
        return { [token.symbol]: tokenAddress };
      })
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
    const poolCt = await deployPoolAndRegister(poolFixedTokens, deployer, governanceFeeRecipient);
    log(
      ("Pool" + JSON.stringify(poolTokens.map((t) => t.tokenNumber)) + ":").padStart(padding),
      poolCt.address
    );
  }
  log("deployment complete");
}
