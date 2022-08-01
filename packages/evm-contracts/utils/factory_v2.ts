import "@openzeppelin/hardhat-upgrades";
import { ethers, deployments } from "hardhat";
import { Contract } from "ethers";
import { Deployment, DeploymentSubmission } from "hardhat-deploy/types";

export async function deployProxy(
  name: string,
  logicName: string,
  logicAddress: string,
  swimFactory: Contract,
  salt: string,
  encodedData?: string
): Promise<Deployment> {
  const { save, getArtifact } = deployments;
  const proxyAddress = await swimFactory.determineProxyAddress(salt);
  const receipt = await swimFactory.createProxy(logicAddress, salt, encodedData);
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
