import * as dotenv from "dotenv";

import { task } from "hardhat/config";
import 'hardhat-deploy';
import { HardhatUserConfig } from "hardhat/types";
//import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

task("accounts", "Prints the list of accounts", async (_, hre) => {
  const named = await hre.getNamedAccounts()

  for (const [name, address] of Object.entries(named)) {
    console.log(name, address);
  }

  const unnamed = await hre.getUnnamedAccounts();
  for (const address of unnamed) {
    console.log(address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9", // Latest solc version that's supported by Hardhat
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000, // Optimize heavily for runtime gas cost rather than deployment gas cost
      },
      outputSelection: {
        "*": {
          "*": [
            "metadata",
            "evm.bytecode",
            "evm.bytecode.sourceMap",
            "ir",
            // "irOptimized",
            // "evm.assembly",
          ],
          // "": ["ast"],
        },
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      deploy: ["./deploy/hardhat/"],
      autoImpersonate: true,
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 4,
    },
    localhost: {
      url: "http://127.0.0.1:8545/", // yarn hardhat node -> spins node on local network as ganache
      // accounts: No need for this! Thanks Hardhat!
      chainId: 31337,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    governance: {
      default: 1,
    },
    governanceFeeRecipient: {
      default: 2,
    },
    testLiquidityProvider: {
      default: 10,
    },
    testUser: {
      default: 11,
    },
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/hardhat-deploy/extendedArtifacts",
      },
    ],
  },
};

export default config;
