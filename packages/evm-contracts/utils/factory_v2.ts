import "@openzeppelin/hardhat-upgrades";
import { ethers, deployments } from "hardhat";
import { Contract } from "ethers";
import { Deployment, DeploymentSubmission } from "hardhat-deploy/types";

export async function deployProxy(
  name: string,
  logicName: string,
  logicAddress: string,
  factoryContract: Contract,
  salt: string,
  encodedData?: string
): Promise<Deployment> {
  const { save, getArtifact } = deployments;
  const [deployer] = await ethers.getSigners();
  const proxyAddress = await factoryContract.determineProxyAddress(salt);
  const receipt = await factoryContract
    .attach(deployer.address)
    .createProxy(logicAddress, salt, encodedData);
  const artifact = await getArtifact(logicName);

  const deployment: DeploymentSubmission = {
    ...artifact,
    address: proxyAddress,
    args: [encodedData],
    transactionHash: receipt.transactionHash,
    receipt,
  };
  await save(name, deployment);

  return deployment;
}
