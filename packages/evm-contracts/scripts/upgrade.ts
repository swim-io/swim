import hre from "hardhat";
import fs from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const expectImplementation = async (hre: HardhatRuntimeEnvironment, contractName: string) => {
  const {
    deployments: { get, read, execute },
  } = hre;
  const contract = await get(contractName);
  const actualImpl = await read("MyProxyAdmin", "getProxyImplementation", contract.address);
  const expectedImpl = await get("MyContract");

  if (actualImpl !== expectedImpl) {
    console.log(`${contractName} with wrong implementation`);
  }
};

const main = async () => {
  await hre.run("compile");
  await hre.run("deploy");
  console.log(
    `================= CHANGE IMPLEMENTATION AND DEPLOY AGAIN ===========================`
  );
  fs.copyFileSync("./MyContractV2.sol", "./contracts/MyContract.sol");

  await hre.run("deploy");

  await expectImplementation(hre, "MyContractA");
  await expectImplementation(hre, "MyContractB");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
