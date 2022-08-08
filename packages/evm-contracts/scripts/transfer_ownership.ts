import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();
const { OLD_MNEMONIC, NEW_MNEMONIC } = process.env;

const CONTRACT_NAME = "SwimFactory";
const CONTRACT_ADDRESS = "0x77C1f7813D79c8e6E37DE1aA631B6F961fD45648";
const IS_POOL = false;

async function main() {
  const chainId = (await ethers.provider.detectNetwork()).chainId;
  console.log("executing deployment script for chain:", chainId);

  const [deployer, governance] = await ethers.getSigners(); // OLD signer addresses loaded from networks, ex: BNB_TESTNET_MNEMONIC

  if (!OLD_MNEMONIC) throw Error("Old Mnemonic not set in environment");
  if (!NEW_MNEMONIC) throw Error("New Mnemonic not set in environment");

  const newDeployer = ethers.Wallet.fromMnemonic(NEW_MNEMONIC).connect(deployer.provider!);

  console.log("New wallet address", newDeployer.address);
  console.log("Old signers", deployer.address, governance.address);

  const contract = await ethers.getContractAt(CONTRACT_NAME, CONTRACT_ADDRESS);

  const transferGovernance = async () => {
    const currentOwner = await contract.governance();

    console.log(CONTRACT_NAME, contract.address);
    console.log("Current owner", currentOwner);

    const tx = await contract.connect(governance).transferGovernance(newDeployer.address);
    console.log("Transaction event : ", await tx.wait());

    const newOwner = await contract.governance();
    console.log("New owner", newOwner);
  };

  const transferOwnership = async () => {
    const currentOwner = await contract.owner();

    console.log(CONTRACT_NAME, contract.address);
    console.log("Current owner", currentOwner);

    const tx = await contract.connect(deployer).transferOwnership(newDeployer.address);
    console.log("Transaction event : ", await tx.wait());

    const newOwner = await contract.owner();
    console.log("New owner", newOwner);
  };

  if (IS_POOL) {
    await transferGovernance();
  } else {
    await transferOwnership();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
