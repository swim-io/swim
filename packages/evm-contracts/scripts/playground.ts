/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable functional/immutable-data */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { readFile, readdir } from "fs/promises";

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";

import {
  ChainConfig,
  RoutingConfig,
  SWIM_USD_SOLANA_ADDRESS,
  WORMHOLE_SOLANA_CHAIN_ID,
} from "../src/config";
import { CHAINS } from "../src/config";
import {
  confirm,
  getLogic,
  getProxy,
  getRoutingProxy,
  getSwimFactory,
  getToken,
} from "../src/deploy";
import { decodeVaa } from "../src/payloads";
import { PoolWrapper, RoutingWrapper, TokenWrapper } from "../src/testUtils";
import type { Pool } from "../typechain-types/contracts/Pool";
import { ITokenBridge } from "../typechain-types/contracts/interfaces/ITokenBridge";

const toHexBytes = (val: number, bytes: number) => {
  const hex = ethers.utils.hexlify(val).substring(2);
  const requiredBytes = hex.length / 2;
  if (requiredBytes > 2 * bytes)
    throw Error(`Could not convert ${val} (= 0x${hex}) does not fit in ${bytes} bytes`);

  return "00".repeat(bytes - requiredBytes) + hex;
};

const blankConstructor = (deployedBytecodeSize: number) =>
  "0x" +
  "61" + //PUSH2
  toHexBytes(deployedBytecodeSize, 2) +
  "80" + //DUP
  "60" + //PUSH1
  "0c" + //constructor code size (=12 bytes)
  "60" + //PUSH1
  "00" + //CODECOPY dstOst argument
  "39" + //CODECOPY
  "60" + //PUSH1
  "00" + //RETURN ost argument
  "f3"; //RETURN

async function poolDeploymentDebugging() {
  //const size = 22060;
  const size = 14376;
  const deployedBytecode = "ff".repeat(size);
  const dummyBytecode = blankConstructor(size) + deployedBytecode;

  const factory = await (
    await (await ethers.getContractFactory("TestFactory")).deploy()
  ).deployed();

  const getCode = async () =>
    ethers.provider.getCode(
      ethers.utils.getContractAddress({
        from: deployer.address,
        nonce: await deployer.getTransactionCount(),
      })
    );

  const [deployer] = await ethers.getSigners();
  try {
    console.log("Normal deployment:");
    await deployer.sendTransaction({ data: dummyBytecode });
    console.log("success");
    console.log("deployed bytecode matches:", (await getCode()) === "0x" + deployedBytecode);
  } catch (error) {
    console.log("failed:", error);
  }

  try {
    console.log("TestFactory.create:");
    await factory.create(dummyBytecode);
    console.log("success");
    console.log("deployed bytecode matches:", (await getCode()) === "0x" + deployedBytecode);
  } catch (error) {
    console.log("failed:", error);
  }
}

async function compareBytecode() {
  const files = await Promise.all(
    ["before", "after", "latest"].map(async (f) =>
      JSON.parse(await readFile("./" + f + ".json", "utf-8"))
    )
  );

  const sizes = new Map();
  for (const file of files) {
    const contracts = file.output.contracts;
    for (const key of Object.keys(contracts)) {
      if (key.startsWith("contracts/") && key.indexOf("/", "contracts/".length) == -1) {
        const name = key.slice("contracts/".length, -4);
        if (contracts[key][name]) {
          const bytecode = contracts[key][name].evm.bytecode.object;
          if (sizes.has(name)) sizes.get(name).push(bytecode.length / 2);
          else sizes.set(name, [bytecode.length / 2]);
        }
      }
    }
  }

  console.log(sizes);
}

function decodePacked(args: readonly string[], encoded: string): any {
  let offset = 2;
  const readBytes = (size: number): string => {
    const val = encoded.substring(offset, offset + 2 * size);
    offset += 2 * size;
    return "0x" + val;
  };

  const argToSize = (arg: string) => {
    if (arg === "address") return 20;
    else if (arg.startsWith("uint")) return parseInt(arg.substring(4)) / 8;
    else if (arg.startsWith("bytes") && arg.length != 5) return parseInt(arg.substring(5));
    else throw Error(`unknown argument ${arg}`);
  };

  const convert = (arg: string) => {
    const val = readBytes(argToSize(arg));
    if (arg === "address") return ethers.utils.getAddress(val);
    if (arg.startsWith("uint")) return BigNumber.from(val);
    else return val;
  };

  return args.map(convert);
}

async function printAssembly(contract: string) {
  const buildDir = "artifacts/build-info/";
  const [buildInfoFile] = await readdir(buildDir);
  const buildInfo = JSON.parse(await readFile(buildDir + buildInfoFile, { encoding: "utf-8" }));
  console.log(buildInfo.output.contracts["contracts/" + contract + ".sol"][contract].evm.assembly);
}

const transferEth = (from: SignerWithAddress, to: string, etherAmount: string) =>
  //e.g. etherAmount = "0.1" for .1 eth
  confirm(from.sendTransaction({ to, value: ethers.utils.parseEther(etherAmount) }));

async function printAttestedSwimUsd() {
  const chainConfig = await getChainConfig();
  const tokenBridge = (await ethers.getContractAt(
    "ITokenBridge",
    (chainConfig.routing as RoutingConfig).wormholeTokenBridge!
  )) as ITokenBridge;
  const swimUsdAddress = await tokenBridge.wrappedAsset(
    WORMHOLE_SOLANA_CHAIN_ID,
    SWIM_USD_SOLANA_ADDRESS
  );
  console.log(swimUsdAddress);
}

async function transferAllEth(to: string) {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();
  const refundCost = (await ethers.provider.getFeeData()).gasPrice!.mul(21000);
  const fmt = ethers.utils.formatEther;
  if (balance.gt(refundCost)) {
    const value = balance.sub(refundCost);
    console.log(
      `transferring ${ethers.utils.formatEther(value)} (= ${fmt(balance)} balance - ${fmt(
        refundCost
      )} refundCost) from ${deployer.address} to ${to}`
    );
    await confirm(deployer.sendTransaction({ to, value }));
  } else
    console.log(
      `nothing to transfer - ${deployer.address} has balance of ${fmt(
        balance
      )}$ which is not sufficient to cover gas costs of refund of ${fmt(refundCost)}`
    );
}

async function getChainConfig() {
  const chainId = (await ethers.provider.detectNetwork()).chainId;
  const chainConfig = CHAINS[chainId];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);
  return chainConfig;
}

const getDefaultPool = async () =>
  getProxy("Pool", (await getChainConfig()).pools![0].salt) as Promise<Pool>;

async function setupWrappers(chainConfig: ChainConfig) {
  const pool = await PoolWrapper.create(chainConfig.pools![0].salt);

  const routing = await RoutingWrapper.create();
  const { swimUsd } = routing;

  return { pool, routing, swimUsd };
}

async function printBalances() {
  const chainConfig = await getChainConfig();
  const { pool } = await setupWrappers(chainConfig);
  const [deployer] = await ethers.getSigners();
  console.log(`balances of ${deployer.address} on ${chainConfig.name}`);
  console.table({
    gasToken: { tokenAddress: "", balance: ethers.utils.formatEther(await deployer.getBalance()) },
    ...Object.fromEntries(
      await Promise.all(
        pool.tokens.map(async (token) => [
          token.symbol,
          {
            tokenAddress: token.address,
            balance: await token.balanceOf(deployer),
            totalSupply: await token.totalSupply(),
          },
        ])
      )
    ),
  });
  // console.log(`gas token:`, ethers.utils.formatEther(await deployer.getBalance()));
  // for (const token of pool.tokens)
  //   console.log(`${token.symbol} (${token.address}):`, await token.balanceOf(deployer));
}

async function wormholeSwimUsd() {
  const recipient = "0x866450d3256310D51Ff3aac388608e30d03d7841";
  const [deployer] = await ethers.getSigners();
  const { routing, swimUsd } = await setupWrappers(await getChainConfig());
  await routing.propellerInitiate(
    deployer,
    swimUsd,
    6000,
    10,
    "0x" + "00".repeat(12) + recipient.slice(2),
    false,
    1000,
    0
  );
}

const getFuncSelector = (functionSignature: string) =>
  ethers.utils.keccak256(Buffer.from(functionSignature)).slice(0, 10);

async function printWormholeEmitters() {
  const chainConfig = await getChainConfig();
  const tokenBridge = (chainConfig.routing as RoutingConfig).wormholeTokenBridge;
  console.log(`registered emitters for Token Bridge (${tokenBridge}) on ${chainConfig.name}`);
  const chainIds = [1, 2, 4, 5, 6, 10];
  console.log("chainId", "emitter");
  for (const chainId of chainIds)
    console.log(
      chainId.toString().padStart(7),
      await ethers.provider.call({
        to: tokenBridge,
        data: getFuncSelector("bridgeContracts(uint16)") + chainId.toString().padStart(64, "0"),
      })
    );
}

async function main() {
  await printWormholeEmitters();
  // await printBalances();
  // const [deployer] = await ethers.getSigners();
  // await deployer.sendTransaction({
  //   to: "0x280999ab9abfde9dc5ce7afb25497d6bb3e8bdd4",
  //   data: "0x4a0cfc6b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000012d01000000000100e47c4b37ed8e168a7be81c39d8eae4d1e7e557b520a30788641c612f248c5946664aa021b38c7c92bc4b3f0417389010132100b7edd6b5e140fcd5e5c90ee80100633d21140000001f0002000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7000000000000086101030000000000000000000000000000000000000000000000000000000165a0bc00296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe267190001000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd4000a000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd401000000000000000000000000866450d3256310d51ff3aac388608e30d03d7841010000000000000003e8000000000000000000000000000000000000000000",
  // });
  // const { pool } = await setupWrappers(await getChainConfig());
  // await pool.add(deployer, [5000, 5000, 1000], 0);
  // await ethers.provider.estimateGas({
  //   from: "0x2fd34874480371d80904d2822e58aeade3aa1c74",
  //   to: "0x280999ab9abfde9dc5ce7afb25497d6bb3e8bdd4",
  //   data: "0x4a0cfc6b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000012d01000000000100e47c4b37ed8e168a7be81c39d8eae4d1e7e557b520a30788641c612f248c5946664aa021b38c7c92bc4b3f0417389010132100b7edd6b5e140fcd5e5c90ee80100633d21140000001f0002000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7000000000000086101030000000000000000000000000000000000000000000000000000000165a0bc00296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe267190001000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd4000a000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd401000000000000000000000000866450d3256310d51ff3aac388608e30d03d7841010000000000000003e8000000000000000000000000000000000000000000",
  // });
  // const encodedVm =
  //   "01000000000100e47c4b37ed8e168a7be81c39d8eae4d1e7e557b520a30788641c612f248c5946664aa021b38c7c92bc4b3f0417389010132100b7edd6b5e140fcd5e5c90ee80100633d21140000001f0002000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7000000000000086101030000000000000000000000000000000000000000000000000000000165a0bc00296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe267190001000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd4000a000000000000000000000000280999ab9abfde9dc5ce7afb25497d6bb3e8bdd401000000000000000000000000866450d3256310d51ff3aac388608e30d03d7841010000000000000003e80000";
  // console.log(decodeVaa(encodedVm));
  //console.log(await routingProxy.contract.estimateGas.propellerComplete("0x" + encodedVm));
  // console.log(
  //   await routingProxy.contract.estimateGas[
  //     "propellerInitiate(address,uint256,uint16,bytes32,bool,uint64)"
  //   ](
  //     "0x92934a8b10ddf85e81b65be1d6810544744700dc",
  //     1,
  //     4,
  //     "0x00000000000000000000000092934a8b10ddf85e81b65be1d6810544744700dc",
  //     false,
  //     1,
  //     { from: "0x866450d3256310d51ff3aac388608e30d03d7841" }
  //   )
  // );
  //printEncodedVM();
  //console.log("latest block:", await ethers.provider.getBlockNumber());
  //await transferAllEth("0x866450d3256310D51Ff3aac388608e30d03d7841");
  //await printAttestedSwimUsd();
  //await printTestnetState();
  //await compareBytecode();
  //const [deployer, governance] = await ethers.getSigners();
  // const { pool, swimUsd, token1, token2 } = await setupWrappers();
  // const [chiu] = await ethers.getSigners();
  // const tokens = [swimUsd, token1, token2];
  // console.log("wallet funds:", await Promise.all(tokens.map((t) => t.balanceOf(chiu))));
  // await pool.add(chiu, pool.toAtomicAmounts("5000"), 0);
  // console.log("after", await pool.contract.getState());
  //await printTokenBalances(deployer.address);
  // const pool = await getDefaultPool();
  // console.log(pool.address, await pool.getState());
  // const pool = await ethers.getContractAt("Pool", "0x944fd8212c855e82e654ce70cd54566edf90f532");
  //console.log(pool.address, await pool.getState());
  // const lpToken = await ethers.getContractAt(
  //   "ERC20Token",
  //   "0x57FCF9B276d3E7D698112D9b87e6f410B1B5d78d"
  // );
  // const lpAmount = "90000000000";
  // console.log(await lpToken.balanceOf(chiu.address));
  // await confirm(lpToken.approve(pool.address, lpAmount));
  // await confirm(pool["removeUniform(uint256,uint256[])"](lpAmount, ["0", "0", "0"]));
  // console.log(await lpToken.balanceOf(chiu.address));
  // console.log((await pool.getMarginalPrices()).map((p: BigNumber) => p.toString()));
  //await manualTesting();
  // console.log(await deployer.getBalance());
  //console.log(await tokenBridge.wrappedAsset(1, "0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719"));
  //const uniswap = await ethers.getContractAt("IUniswapV3PoolState", "0x9dcF9D205C9De35334D646BeE44b2D2859712A09");
  // const sender = "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f";
  // const memo = "0x32a3624e63482375429f829eaca4db2e" + "00".repeat(16);
  // const usdc = await ethers.getContractAt("ERC20Token", "0x45b167cf5b14007ca0490dcfb7c4b870ec0c0aa6");
  // console.log(await usdc.allowance(
  //  "0xb0A05611328d1068c91F58e2c83Ab4048De8CD7f",
  //  "0xa33E4d9624608c468FE5466dd6CC39cE1Da4FF78"
  // ));
  // const signers = await ethers.getSigners();
  // for (let i = 1; i < signers.length; ++i)
  //   console.log(signers[i].address, ethers.utils.formatEther(await signers[i].getBalance()));
  //   const balance = await signers[i].getBalance();
  //   const gasPrice = await ethers.provider.getGasPrice();
  //   const estimateTxFee = gasPrice.mul(21000);
  //   if (balance.gt(estimateTxFee))
  //     await signers[i].sendTransaction({ to: signers[0].address, value: balance.sub(estimateTxFee) });
  //   //console.log("balance after:", await signers[i].getBalance());
  // }
  // const pool = await ethers.getContractAt("Pool", "0x724956bF166471a2cac8b70975Dce27089a39Cb4");
  // console.log("pool state:", JSON.stringify(await pool.getState(),null,2));
  // for (let i = 0; i < 150; ++i)
  //   console.log(i, await ethers.provider.getStorageAt("0x724956bF166471a2cac8b70975Dce27089a39Cb4", i));
  // const sender = "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f";
  // //console.log(await usdc.balanceOf(sender));
  // //console.log(await usdc.estimateGas.approve(pool, "2000000000"));
  // //console.log("allowance:", await usdc.allowance(sender, pool));
  //const lpToken = await ethers.getContractAt("Routing", "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375");
  // console.log(await lpToken.name());
  // console.log(await lpToken.symbol());
  // console.log(await lpToken.decimals());
  //const swimFactory = await getSwimFactory();
  // const filter = swimFactory.filters.ContractCreated(routing.address);
  // const [deployEvent] = await swimFactory.queryFilter(filter);
  // console.log(await deployEvent.getTransaction());
  // const initializeEncoded = routing.interface.encodeFunctionData(
  //   "initialize",
  //   [
  //     "0x1c4955a6caac65ea5fab4cebaba619c287a322a7",
  //     "0xf890982f9310df57d00f659cf4fd87e65aded8d7",
  //   ]
  // );
  // console.log(initializeEncoded)
  // console.log(ethers.Wallet.createRandom().mnemonic);
  // console.log(ethers.utils.hexlify(20490));
  // console.log(JSON.stringify(await ethers.provider.getTransactionReceipt("0x26c407c4bb570adb57026d60d3235377eecebb94c1b5732e1c0c592391ec3ada"), null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
