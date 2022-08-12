import { readFile } from "fs/promises";
import * as dotenv from "dotenv";
import { ethers } from "hardhat";

import {
  CHAINS,
  DEFAULTS,
  FACTORY_PRESIGNED,
  SWIM_FACTORY_ADDRESS,
  SWIM_USD_SOLANA_ADDRESS,
  TOKEN_NUMBERS,
} from "../src/config";

import {
  deployRegular,
  deployLogic,
  deployPoolAndRegister,
  deployProxy,
  deploySwimFactory,
  deployToken,
} from "./deploy";

async function checkContractConstant(contractName: string, constantName: string, hexValue: string) {
  //suboptimal, fragile way to check that hardcoded constants in config match those in contracts

  const filePath = "contracts/" + contractName + ".sol";
  const re = new RegExp(
    "constant\\s+" +
      constantName +
      "\\s*=[\\s\\w\\(]*(0x[a-fA-F0-9]{" +
      (hexValue.length - 2) +
      "})\\)*;"
  );
  const contractSource = await readFile(filePath, { encoding: "utf8" });
  const matches = contractSource.match(re);
  if (!matches)
    throw Error(`Failed to find constant ${constantName} in Solidity contract ${contractName}`);

  if (matches[1] !== hexValue)
    throw Error(
      `Expected value ${hexValue} for constant ${constantName} in Solidity contract ` +
        `${contractName} but found ${matches[1]} instead`
    );
}

export async function deployment(print: boolean = false) {
  const padding = 15;
  const log = print ? console.log : () => {};
  const chainId = (await ethers.provider.detectNetwork()).chainId;

  const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);

  console.log("executing deployment script for", chainConfig.name);

  await checkContractConstant("Routing", "SWIM_USD_SOLANA_ADDRESS", SWIM_USD_SOLANA_ADDRESS);
  await checkContractConstant("Pool", "SWIM_FACTORY", SWIM_FACTORY_ADDRESS);

  const [deployer, governance, governanceFeeRecipient] = await ethers.getSigners();
  console.log("deployer:", deployer.address);
  console.log("deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));

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

  log("SwimFactory:".padStart(padding), SWIM_FACTORY_ADDRESS);

  const wormholeTokenBridge = await (async () => {
    if (chainConfig.wormholeTokenBridge !== "MOCK") return chainConfig.wormholeTokenBridge;

    const swimUsd = await deployToken(DEFAULTS.swimUsd, deployer);
    return (await deployRegular("MockTokenBridge", [swimUsd.address])).address;
  })();

  const lpLogic = await deployLogic("LpToken");
  await checkContractConstant("Pool", "LP_TOKEN_LOGIC", lpLogic.address);
  log("LpLogic:".padStart(padding), lpLogic.address);
  log("RoutingLogic:".padStart(padding), (await deployLogic("Routing")).address);
  log("PoolLogic:".padStart(padding), (await deployLogic("Pool")).address);
  const routingProxy = await deployProxy("Routing", [deployer.address, wormholeTokenBridge]);
  await checkContractConstant("Pool", "ROUTING_CONTRACT", routingProxy.address);
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
    const poolCt = await deployPoolAndRegister(poolFixedTokens, governance, governanceFeeRecipient);
    log(
      ("Pool" + JSON.stringify(poolTokens.map((t) => t.tokenNumber)) + ":").padStart(padding),
      poolCt.address
    );
  }
  console.log("deployment complete");
}
