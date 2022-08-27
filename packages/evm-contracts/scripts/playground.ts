import { ethers, artifacts } from "hardhat";
import { getSwimFactory } from "../src/deploy";

const toHexBytes = (val: number, bytes: number) => {
  const hex = ethers.utils.hexlify(val).substring(2);
  const requiredBytes = hex.length/2;
  if (requiredBytes > 2 * bytes)
    throw Error("Could not convert " + val + "(= 0x" + hex + " ) does not fit in " + bytes + "bytes");

  return "00".repeat(bytes - requiredBytes) + hex;
}

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

  const factory = await (await (await ethers.getContractFactory("TestFactory")).deploy()).deployed();

  const getCode = async () => ethers.provider.getCode(
    ethers.utils.getContractAddress(
      {from: deployer.address, nonce: await deployer.getTransactionCount()}
    )
  );

  const [deployer] = await ethers.getSigners();
  try {
    console.log("Normal deployment:");
    await deployer.sendTransaction({data: dummyBytecode});
    console.log("success");
    console.log("deployed bytecode matches:", await getCode() === "0x"+deployedBytecode);
  }
  catch (error) {
    console.log("failed:", error);
  }

  try {
    console.log("TestFactory.create:");
    await factory.create(dummyBytecode);
    console.log("success");
    console.log("deployed bytecode matches:", await getCode() === "0x"+deployedBytecode);
  }
  catch (error) {
    console.log("failed:", error);
  }
}


async function main() {
  // const tokenBridge = await ethers.getContractAt("ITokenBridge", "0x9dcF9D205C9De35334D646BeE44b2D2859712A09");
  // console.log(await tokenBridge.wrappedAsset(1, "0x44a0a063099540e87e0163a6e27266a364c35930208cfaded5b79377713906e9"));

  //const routing = await ethers.getContractAt("Routing", "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375");
  //console.log(await routing.swimUsdAddress());

  console.log(ethers.Wallet.createRandom().mnemonic);

  // const pool = await ethers.getContractAt("Pool", "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823");
  // console.log("pool state:", JSON.stringify(await pool.getState(),null,2));

  //console.log(ethers.utils.hexlify(20490));

  // const newdepl = await (await (await ethers.getContractFactory("NewDepl")).deploy()).deployed();
  // console.log(await newdepl.poolLogic());

  //const [deployer] = await ethers.getSigners();
  //const usdc = await ethers.getContractAt("ERC20", "0x45b167cf5b14007ca0490dcfb7c4b870ec0c0aa6");

  // const sender = "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f";
  // //console.log(await usdc.balanceOf(sender));
  // //console.log(await usdc.estimateGas.approve(pool, "2000000000"));
  // //console.log("allowance:", await usdc.allowance(sender, pool));


  //const lpToken = await ethers.getContractAt("Routing", "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375");
  // console.log(await lpToken.name());
  // console.log(await lpToken.symbol());
  // console.log(await lpToken.decimals());

  // const swimFactory = await getSwimFactory();

  // console.log(JSON.stringify(await ethers.provider.getTransactionReceipt("0x26c407c4bb570adb57026d60d3235377eecebb94c1b5732e1c0c592391ec3ada"), null, 2));

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
}

main();
//poolDeploymentDebugging();
