// eslint-disable @typescript-eslint/no-unsafe-assignment
import { getContractAddress } from "@ethersproject/address";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { DEFAULTS, SWIM_FACTORY_ADDRESS } from "./config";

const ERC1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export async function getSwimFactory(): Promise<Contract> {
  return ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS);
}

export async function isDeployed(address: string): Promise<boolean> {
  // > 2 in case empty code gives a return of "0x"
  return (await ethers.provider.getCode(address)).length > 2;
}

type PoolInfo = {
  readonly salt: string;
  readonly lpSalt: string;
  readonly tokens: readonly { readonly address: string; readonly tokenNumber: number }[];
  readonly precision?: number;
  readonly lpName?: string;
  readonly lpSymbol?: string;
  readonly lpDecimals?: number;
  readonly ampFactor?: number;
  readonly lpFee?: number;
  readonly govFee?: number;
};

type TokenInfo = {
  readonly symbol: string;
  readonly decimals: number;
};

export async function deployPoolAndRegister(
  pool: PoolInfo,
  poolLogic: Contract,
  routingProxy: Contract,
  governance: SignerWithAddress,
  governanceFeeRecipient: SignerWithAddress
): Promise<Contract> {
  const tokenInfo: readonly TokenInfo[] = await Promise.all(
    pool.tokens.map(async ({ address }) => {
      const token = await ethers.getContractAt("ERC20", address);
      return {
        symbol: await token.symbol(),
        decimals: await token.decimals(),
      };
    })
  );

  const lpDecimals = pool.lpDecimals ?? DEFAULTS.lpDecimals;
  const precision = pool.precision ?? DEFAULTS.precision;
  const poolProxy = await deployProxy(poolLogic, pool.salt, [
    pool.lpName ?? "Swim " + tokenInfo.map(({ symbol }) => symbol).join("-") + "-Pool LP",
    pool.lpSymbol ?? tokenInfo.map(({ symbol }) => symbol).join("-") + "-LP",
    pool.lpSalt,
    lpDecimals,
    precision - lpDecimals,
    pool.tokens.map((token) => token.address),
    tokenInfo.map(({ decimals }) => precision - decimals),
    pool.ampFactor ?? DEFAULTS.amp,
    pool.lpFee ?? DEFAULTS.lpFee,
    pool.govFee ?? DEFAULTS.governanceFee,
    governance.address,
    governanceFeeRecipient.address,
  ]);

  for (let i = 0; i < pool.tokens.length; ++i) {
    const poolToken = pool.tokens[i];
    const filter = routingProxy.filters.TokenRegistered(poolToken.tokenNumber);
    const tokenReregisteredEvents = await routingProxy.queryFilter(filter);
    const currentlyRegisteredPool =
      tokenReregisteredEvents.length > 0
        ? tokenReregisteredEvents[tokenReregisteredEvents.length - 1]
        : "";
    if (currentlyRegisteredPool === poolProxy.address)
      await routingProxy.registerToken(
        poolToken.tokenNumber,
        poolToken.address,
        poolProxy.address,
        i + 1
      );
  }

  return poolProxy;
}

export async function deployProxy(
  logic: Contract,
  salt: string,
  initializeArguments: readonly any[]
): Promise<Contract> {
  const swimFactory = await getSwimFactory();
  const proxyAddress: string = (await swimFactory.determineProxyAddress(salt)) as string;
  const initializeEncoded = logic.interface.encodeFunctionData("initialize", initializeArguments);
  if (await isDeployed(proxyAddress)) {
    const slot = await ethers.provider.getStorageAt(proxyAddress, ERC1967_IMPLEMENTATION_SLOT);
    const actualLogic = ethers.utils.getAddress("0x" + slot.substring(2 + 2 * 12));
    if (actualLogic !== logic.address)
      throw Error(
        `Unexpected logic for Proxy ${proxyAddress} - expected: ${logic.address} but found: ${actualLogic}`
      );

    const filter = swimFactory.filters.ContractCreated(proxyAddress);
    const [deployEvent] = await swimFactory.queryFilter(filter);
    const deployData = (await deployEvent.getTransaction()).data;
    const index = deployData.lastIndexOf(initializeEncoded.substring(2));
    const suffixIndex = index === -1 ? -1 : index + initializeEncoded.length - 2;
    if (
      index === -1 ||
      deployData.substring(suffixIndex) !== "0".repeat(deployData.length - suffixIndex)
    )
      console.warn(
        "Deployment transaction of proxy",
        proxyAddress,
        "for logic contract",
        logic.address,
        "was already deployed with different initialize arguments - expected:",
        initializeEncoded,
        "but full original calldata was:",
        deployData
      );
  } else await swimFactory.createProxy(logic.address, salt, initializeEncoded);

  return new Contract(proxyAddress, logic.interface, logic.provider);
}

export async function deployLogic(name: string, salt?: string): Promise<Contract> {
  const deploySalt = salt ?? DEFAULTS.salt;
  const bytecode = (await ethers.getContractFactory(name)).bytecode;
  const swimFactory = await ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS);
  const logicAddress: string = await swimFactory.determineLogicAddress(bytecode, deploySalt);
  if (!(await isDeployed(logicAddress))) await swimFactory.createLogic(bytecode, deploySalt);

  return ethers.getContractAt(name, logicAddress);
}

export async function deploySwimFactory(
  owner: SignerWithAddress,
  factoryMnemonic?: string
): Promise<Contract> {
  if (await isDeployed(SWIM_FACTORY_ADDRESS)) {
    // console.log("SwimFactory was already deployed at:", SWIM_FACTORY_ADDRESS);
    const swimFactory = await getSwimFactory();
    const actualOwner: string = (await swimFactory.owner()) as string;
    if (actualOwner !== owner.address)
      throw Error(
        `Unexpected SwimFactory owner - expected: ${owner.address} but found:  ${actualOwner}`
      );
    return swimFactory;
  }

  if (typeof factoryMnemonic === "undefined")
    throw Error("SwimFactory Mnemonic required for SwimFactory deployment");

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const factoryDeployer = ethers.Wallet.fromMnemonic(factoryMnemonic).connect(owner.provider!);

  if ((await factoryDeployer.getTransactionCount()) !== 0)
    throw Error(`SwimFactory deployer ${factoryDeployer.address} has nonzero transaction count`);

  const precalculatedAddress = getContractAddress({ from: factoryDeployer.address, nonce: 0 });
  if (precalculatedAddress !== SWIM_FACTORY_ADDRESS)
    throw Error(
      `Unexpected precalulated SwimFactory address - expected: ${SWIM_FACTORY_ADDRESS} but got: ${precalculatedAddress}`
    );

  const swimFactoryFactory = (await ethers.getContractFactory("SwimFactory")).connect(
    factoryDeployer
  );

  const gasEstimate = factoryDeployer.estimateGas(
    swimFactoryFactory.getDeployTransaction(owner.address)
  );

  const { maxFeePerGas } = await ethers.getDefaultProvider().getFeeData();
  if (!maxFeePerGas) {
    throw Error("Max fee per gas could not be retrived");
  }
  const maxCost = (await gasEstimate).mul(maxFeePerGas);
  const curBalance = await factoryDeployer.getBalance();

  if (curBalance.lt(maxCost)) {
    const topUp = maxCost.sub(curBalance);
    if ((await owner.getBalance()).lt(topUp))
      throw Error("deployer has insufficient funds to send to factory deployer");
    //strictly speaking this could still fail because we have to pay for the
    // gas of the transaction too and then there might not be enough left...
    await owner.sendTransaction({ to: factoryDeployer.address, value: topUp });
  }

  const swimFactory = await (await swimFactoryFactory.deploy(owner.address)).deployed();

  if (swimFactory.address !== SWIM_FACTORY_ADDRESS)
    throw Error(
      `Unexpected deployed SwimFactory address - expected: ${SWIM_FACTORY_ADDRESS}  but got: ${swimFactory.address}`
    );

  // const txHash = swimFactory.deployTransaction.hash;
  // const receipt = await network.provider.send("eth_getTransactionReceipt", [txHash]);
  return swimFactory;
}
