import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployment } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

export async function deployProxy(
  name: string,
  logicContract: string,
  salt: string,
  hre: HardhatRuntimeEnvironment,
  ...args: any[]
): Promise<Deployment> {
  const { save, read, execute, get, getArtifact } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const logicArtifact = await getArtifact(logicContract);
  const logicAddress = (await get(logicContract)).address;
  const proxyAddress = await read("SwimFactory", {}, "determineProxyAddress", salt);
  const receipt = await execute(
    "SwimFactory",
    {from: deployer},
    "createProxy",
    logicAddress,
    salt,
    ...args
  );

  const deployment = {
    ...logicArtifact,
    address: proxyAddress,
    args,
    transactionHash: receipt.transactionHash,
    receipt,
    newlyDeployed: true
  };
  await save(name, deployment);

  return deployment;
}

// ADDITIONAL DATA of deployed over artifact:
//
// "transactionHash": "0x8bcaf91ab2484a9079f09b24b4e9b7bfedfa6f10f4fa5d6576bbf823ea4e0fa0",
// "args": [],
// "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
// "receipt": {
//   "to": null,
//   "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
//   "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//   "transactionIndex": 0,
//   "gasUsed": {
//     "type": "BigNumber",
//     "hex": "0x18cf71"
//   },
//   "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
//   "blockHash": "0x8279213af865a4c89b0af61e2e568ea3351e5dd55d9b5a4a5dfce7ad2edd84c5",
//   "transactionHash": "0x8bcaf91ab2484a9079f09b24b4e9b7bfedfa6f10f4fa5d6576bbf823ea4e0fa0",
//   "logs": [],
//   "blockNumber": 1,
//   "confirmations": 1,
//   "cumulativeGasUsed": {
//     "type": "BigNumber",
//     "hex": "0x18cf71"
//   },
//   "effectiveGasPrice": {
//     "type": "BigNumber",
//     "hex": "0x6fc23ac0"
//   },
//   "status": 1,
//   "type": 2,
//   "byzantium": true
// },
// "newlyDeployed": true
