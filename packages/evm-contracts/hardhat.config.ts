import * as dotenv from "dotenv";

import { task } from "hardhat/config";
import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { getContractAddress } from "@ethersproject/address";
import { BigNumber, formatFixed } from "@ethersproject/bignumber";

dotenv.config();
const { FACTORY_MNEMONIC, MNEMONIC, BSCSCAN_API_KEY, ETHERSCAN_API_KEY } = process.env;

task(
  "factoryAddress",
  "Prints the address the SwimFactory will be deployed to given the FACTORY_MNEMONIC",
  async (_, { ethers }) => {
    if (typeof FACTORY_MNEMONIC === "undefined") {
      console.log("Factory Mnemonic not set in environment");
      return;
    }
    const wallet = ethers.Wallet.fromMnemonic(FACTORY_MNEMONIC);
    console.log(getContractAddress({ from: wallet.address, nonce: 0 }));
  }
);

task("deploy", "run the deployment script", async (_, hre) => {
  await hre.run("compile");
  await hre.run("run", { script: "scripts/deployment.ts" });
});

task(
  "updates",
  "Updates a given proxy contract to a new implementation via updateTo",
  async ({ proxy, logic, owner }, hre) => {
    const { ethers } = hre;
    const _owner = owner ? await ethers.getSigner(owner) : (await ethers.getSigners())[0];
    const _proxy = (await ethers.getContractAt("BlankLogic", proxy)).connect(_owner);
    await _proxy.upgradeTo(logic);
  }
)
  .addPositionalParam("proxy", "address of the proxy that will be upgraded")
  .addPositionalParam(
    "logic",
    "address of the logic contract that will serve as the new implementation"
  )
  .addOptionalPositionalParam("owner", "owner who's authorized to execute the upgrade", "");

task("pool-state", "Print state of given pool", async ({ pool }, { ethers }) => {
  const [isPaused, balances, lpSupply, ampFactorDec, lpFeeDec, govFeeDec] = await (
    await ethers.getContractAt("Pool", pool)
  ).getState();
  const decimaltoFixed = (decimal: [BigNumber, number]) => formatFixed(decimal[0], decimal[1]);
  const getDecimals = async (address: string) =>
    (await ethers.getContractAt("ERC20", address)).decimals();
  const toTokenInfo = async (token: [string, BigNumber]) => ({
    address: token[0],
    amount: decimaltoFixed([token[1], await getDecimals(token[0])]),
  });
  const state = {
    isPaused,
    balances: await Promise.all(balances.map(toTokenInfo)),
    lpSupply: await toTokenInfo(lpSupply),
    ampFactor: decimaltoFixed(ampFactorDec),
    lpFee: decimaltoFixed(lpFeeDec),
    govFee: decimaltoFixed(govFeeDec),
  };
  console.log(JSON.stringify(state, null, 2));
}).addPositionalParam("pool", "address of the pool");

// task("logicAddress", "Prints the address a logic contract will be deployed to given a its salt",
//   async ({logicContract, salt}, hre) => {
//     await hre.run("compile");
//     //TODO
//   },
// ).addParam("logic", "name of the contract").addParam("salt");

// task("proxyAddress", "Prints the address a proxy contract will be deployed to given its salt",
//   async ({salt}, hre) => {
//     //TODO
//   },
// ).addParam("salt", "salt passed to the create2 call in SwimFactory");

task("presign", "Generates and prints a Deterministic Factory tx", async (_, hre) => {
  await hre.run("compile");

  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const deployData = (await ethers.getContractFactory("SwimFactory")).getDeployTransaction(
    deployer.address
  );
  const deployTx = {
    ...deployData,
    to: undefined,
    nonce: 0,
    gasLimit: ethers.BigNumber.from("2000000"),
    chainId: 31337,
    gasPrice: ethers.BigNumber.from("1875000000"), //TODO
  };
  if (typeof FACTORY_MNEMONIC === "undefined") {
    console.log("Factory Mnemonic not set in environment");
    return;
  }
  const wallet = ethers.Wallet.fromMnemonic(FACTORY_MNEMONIC);
  const signedTx = await wallet.signTransaction(deployTx);
  console.log(signedTx);
});

const sharedNetworkConfig: HttpNetworkUserConfig = {
  accounts: { mnemonic: MNEMONIC! },
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Optimize heavily for runtime gas cost rather than deployment gas cost
      },
      outputSelection: {
        "*": {
          "*": [
            "metadata",
            "evm.bytecode",
            "evm.bytecode.sourceMap",
            "ir",
            "irOptimized",
            "evm.assembly",
          ],
          // "": ["ast"],
        },
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      loggingEnabled: false,
      chainId: 31337,
      //allowUnlimitedContractSize: true,
      //blockGasLimit: 1000000000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545/", // yarn hardhat node -> spins node on local network as ganache
      // accounts: No need for this, generated by Hardhat!
      chainId: 31337,
    },
    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 5,
      ...sharedNetworkConfig,
    },
    bnbtestnet: {
      url: "https://apis.ankr.com/f958c7d8af2244c686cad678b7b39fc8/40368bdfe11e91019e93b8797c65a1f3/binance/full/test",
      chainId: 97,
      ...sharedNetworkConfig,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    currency: "USD",
  },
  etherscan: {
    // apiKey: BSCSCAN_API_KEY,
    // apiKey: AVAXSCAN_APY_KEY,
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
