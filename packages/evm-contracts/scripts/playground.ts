import { readFile, readdir } from 'fs/promises';
import { BigNumber, utils } from "ethers";
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

function decodePacked(args: readonly string[], encoded: string): any {
  let offset = 2;
  const readBytes = (size: number): string => {
    const val = encoded.substring(offset, offset + 2*size);
    offset += 2*size;
    return "0x" + val;
  };

  const argToSize = (arg: string) => {
    if (arg === "address")
      return 20;
    else if (arg.startsWith("uint"))
      return parseInt(arg.substring(4))/8;
    else if (arg.startsWith("bytes") && arg.length != 5)
      return parseInt(arg.substring(5));
    else
      throw Error(`unknown argument ${arg}`);
  };

  const convert = (arg: string) => {
    const val = readBytes(argToSize(arg));
    if (arg === "address")
      return ethers.utils.getAddress(val);
    if (arg.startsWith("uint"))
      return BigNumber.from(val);
    else
      return val
  };

  return args.map(convert);
}

function printEncodedVM() {
  const parseCoreBridge = (arr: Buffer) => {
    const version = arr.readUInt8(0);
    const guardianSetIndex = arr.readUInt32BE(1);
    const sigCount = arr.readUInt8(5);
    let signatures = [] as string[];
    const signatureSize = 66;
    let offset = 6;
    for (let i = 0; i < sigCount; ++i) {
      signatures.push(arr.slice(offset, offset + signatureSize).toString("hex"));
      offset += signatureSize;
    }
    const timestamp = arr.readUInt32BE(offset);
    const nonce = arr.readUInt32BE(offset + 4);
    const emitterChain = arr.readUInt16BE(offset + 8);
    const emitterAddress = arr.slice(offset + 10, offset + 42).toString("hex");
    const sequence = arr.readBigUint64BE(offset + 42);
    const consistencyLevel = arr.readUInt8(offset + 50);
    const payload = arr.slice(offset + 51);

    return {
      version,
      guardianSetIndex,
      signatures,
      timestamp,
      nonce,
      emitterChain,
      emitterAddress,
      sequence,
      consistencyLevel,
      payload,
    };
  };

  const parseTokenBridge = (arr: Buffer) => ({
    amount: BigNumber.from(arr.slice(1, 1 + 32)).toBigInt(),
    // For whatever reason parseTransferWithPayload names these originAddress/Chain,
    originAddress: arr.slice(33, 33 + 32).toString("hex"),
    originChain: arr.readUInt16BE(65),
    targetAddress: arr.slice(67, 67 + 32).toString("hex"),
    targetChain: arr.readUInt16BE(99),
    senderAddress: arr.slice(101, 101 + 32).toString("hex"),
    extraPayload: arr.slice(133)
  });

  const parseSwimPayload = (arr: Buffer) => {
    const version = arr.readUInt8(0);
    const toOwner = arr.slice(1, 1 + 32).toString("hex");
    if (arr.length == 33)
      return {version, toOwner};

    const propellerEnabled = arr.readUInt8(33) == 1 ? true : false;
    const gasKickstartEnabled = arr.readUInt8(34) == 1 ? true : false;
    const tokenNumber = arr.readUInt16BE(35);
    if (arr.length == 37)
      return {version, toOwner, propellerEnabled, gasKickstartEnabled, tokenNumber};

    const memo = arr.slice(37, 37 + 16).toString("hex");
    return {version, toOwner, propellerEnabled, gasKickstartEnabled, tokenNumber, memo};
  };

  const encodedVm =
    "01000000000100be0dcdfa049489c81b8fe3f4452335df013aa64ae7fb949c19" +
    "bc8d1262a013723235018850b15a33033a330fa96f441162c8a3383cec447b7e" +
    "7524eb68ca6f1900630e1d68000000120002000000000000000000000000f890" +
    "982f9310df57d00f659cf4fd87e65aded8d7000000000000070c0f0300000000" +
    "000000000000000000000000000000000000000000000000000a07f8296b21c9" +
    "a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe2671900010000" +
    "00000000000000000000a33e4d9624608c468fe5466dd6cc39ce1da4ff780004" +
    "000000000000000000000000a33e4d9624608c468fe5466dd6cc39ce1da4ff78" +
    "01000000000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd" +
    "7f";

  const core = parseCoreBridge(Buffer.from(encodedVm, "hex"));
  console.log("core:", core);
  const token = parseTokenBridge(core.payload);
  console.log("token:", token);
  console.log("swim:", parseSwimPayload(token.extraPayload));
}

async function manualTesting() {
  const walletSeed = "";
  const wallet = ethers.Wallet.fromMnemonic(walletSeed).connect(ethers.provider!);
  const routingProxy = (
    await ethers.getContractAt("Routing", "0xa33E4d9624608c468FE5466dd6CC39cE1Da4FF78")
  ).connect(wallet);
  //console.log(await routingProxy.swimUsdAddress());

  const encodedVm = "0x" +
    "0100000000010003cc44dc2672fcb3881443e91e9c3b4507d70c8f1c72b204301" +
    "369bd1a078eae68d91463ac9f6cee56639852387e63d3f55de164dd20191cb512" +
    "5024b24a158700630ef148000000150002000000000000000000000000f890982" +
    "f9310df57d00f659cf4fd87e65aded8d700000000000007160f03000000000000" +
    "0000000000000000000000000000000000000000000000989680296b21c9a4722" +
    "da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe2671900010000000000" +
    "00000000000000a33e4d9624608c468fe5466dd6cc39ce1da4ff7800040000000" +
    "00000000000000000a33e4d9624608c468fe5466dd6cc39ce1da4ff7801000000" +
    "000000000000000000b0a05611328d1068c91f58e2c83ab4048de8cd7f";
  const memo = "0x5662387c418a2f09b3f688b3c7fa3a5b";
  const toToken = "0x4C15919A4354b4416e7aFcB9A27a118bc45818C0";
  const minimumOutputAmount = 0;

  //console.log(routingProxy.estimateGas);

  console.log(await (await routingProxy["crossChainIn(bytes,address,uint256,bytes16)"](encodedVm, toToken, minimumOutputAmount, memo)).wait());
}

function printAssembly(contract: string) {
  const buildDir = "artifacts/build-info/";
  const [buildInfoFile] = await readdir(buildDir);
  const buildInfo = JSON.parse(await readFile(buildDir + buildInfoFile, { encoding: "utf-8" }));
  console.log(buildInfo.output.contracts["contracts/" + contract + ".sol"][contract].evm.assembly);
}

async function main() {
  //printEncodedVM();

  //await manualTesting();

  //const [deployer] = await ethers.getSigners();
  //const tokenBridge = await ethers.getContractAt("ITokenBridge", "0x9dcF9D205C9De35334D646BeE44b2D2859712A09");
  //console.log(await tokenBridge.wrappedAsset(1, "0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719"));

  //const uniswap = await ethers.getContractAt("IUniswapV3PoolState", "0x9dcF9D205C9De35334D646BeE44b2D2859712A09");




  // const sender = "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f";
  // const memo = "0x32a3624e63482375429f829eaca4db2e" + "00".repeat(16);
  // //const filter = routingProxy.filters.SwimInteraction(sender);
  // const filter = routingProxy.filters.SwimInteraction(null, memo);
  // const events = await routingProxy.queryFilter(filter);
  // console.log(events);

  //console.log(routingProxy.interface.events["SwimInteraction(address,bytes16,uint8,bytes,bytes)"]);

  // const usdc = await ethers.getContractAt("ERC20", "0x45b167cf5b14007ca0490dcfb7c4b870ec0c0aa6");
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

  // for (let i = 0; i < 20; ++i)
  //   console.log(i, await ethers.provider.getStorageAt("0x724956bF166471a2cac8b70975Dce27089a39Cb4", i));

  // const sender = "0xb0a05611328d1068c91f58e2c83ab4048de8cd7f";
  // //console.log(await usdc.balanceOf(sender));
  // //console.log(await usdc.estimateGas.approve(pool, "2000000000"));
  // //console.log("allowance:", await usdc.allowance(sender, pool));


  //const lpToken = await ethers.getContractAt("Routing", "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375");
  // console.log(await lpToken.name());
  // console.log(await lpToken.symbol());
  // console.log(await lpToken.decimals());

  // const swimFactory = await getSwimFactory();
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

main();
