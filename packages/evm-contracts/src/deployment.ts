import { readFile } from "fs/promises";

import type { Contract } from "ethers";
import { ethers } from "hardhat";

import type { ChainConfig } from "./config";
import {
  DEFAULTS,
  ROUTING_CONTRACT_SOLANA_ADDRESS,
  SWIM_FACTORY_ADDRESS,
  SWIM_USD_DECIMALS,
  SWIM_USD_SOLANA_ADDRESS,
  isDeployedToken,
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

export type DeployOptions = {
  readonly print?: boolean;
  readonly factoryMnemonic?: string;
};

export async function deployment(chainConfig: ChainConfig, options: DeployOptions = {}) {
  // eslint-disable-next-line no-console
  const log = options.print ? console.log : () => {};
  const logAddress = (name: string, contract: Contract) =>
    log(name.padStart(16) + ":", contract.address);
  log("executing deployment script for", chainConfig.name);

  const [deployer, governanceFeeRecipient] = await ethers.getSigners();
  log("deployer:", deployer.address);
  log("deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));

  await checkConstant("SWIM_USD_SOLANA_ADDRESS", SWIM_USD_SOLANA_ADDRESS);
  await checkConstant("SWIM_USD_DECIMALS", SWIM_USD_DECIMALS.toString());
  await checkConstant("ROUTING_CONTRACT_SOLANA_ADDRESS", ROUTING_CONTRACT_SOLANA_ADDRESS);
  await checkConstant("SWIM_FACTORY", SWIM_FACTORY_ADDRESS);

  logAddress(
    "SwimFactory",
    await deploySwimFactory(deployer, options.factoryMnemonic, chainConfig.factoryPresigned)
  );

  await checkConstant("ROUTING_CONTRACT", await getProxyAddress("Routing"));
  await checkConstant("LP_TOKEN_LOGIC", await getLogicAddress("LpToken"));

  logAddress("LpLogic", await deployLogic("LpToken"));
  logAddress("PoolLogic", await deployLogic("Pool"));

  const routingConfig = chainConfig.routing;
  if (routingConfig === "MOCK") {
    const swimUsd = await deployToken(DEFAULTS.swimUsd, deployer);
    logAddress("RoutingLogic", await deployLogic("MockRoutingForPoolTests"));
    logAddress("RoutingProxy", await deployProxy("MockRoutingForPoolTests", [swimUsd.address]));
  } else {
    const wormholeTokenBridgeAddress = await (async () => {
      if (routingConfig.wormholeTokenBridge !== "MOCK") return routingConfig.wormholeTokenBridge;

      const coreBridge = await deployRegular("MockWormhole", []);
      logAddress("CoreBridge", coreBridge);
      const tokenBridge = await deployRegular("MockTokenBridge", [coreBridge.address]);
      logAddress("TokenBridge", tokenBridge);
      return tokenBridge.address;
    })();
    logAddress("RoutingLogic", await deployLogic("Routing"));
    logAddress(
      "RoutingProxy",
      await deployProxy("Routing", [
        deployer.address,
        wormholeTokenBridgeAddress,
        routingConfig.serviceFee ?? DEFAULTS.serviceFee,
        routingConfig.gasRemunerationMethod ?? DEFAULTS.gasRemunerationMethod,
      ])
    );
  }

  for (const poolConfig of chainConfig.pools ?? []) {
    const poolTokens = await Promise.all(
      poolConfig.tokens.map(async (token) =>
        isDeployedToken(token)
          ? token
          : {
              symbol: token.symbol,
              address: await (async () => {
                const tokenContract = await deployToken(token, deployer);
                logAddress(token.symbol, tokenContract);
                return tokenContract.address;
              })(),
            }
      )
    );
    const pool = await deployPoolAndRegister(
      { ...poolConfig, tokens: poolTokens },
      deployer,
      governanceFeeRecipient
    );
    logAddress("Pool" + JSON.stringify(poolTokens.map((t) => t.symbol)), pool);
  }
  log("deployment complete");
}
