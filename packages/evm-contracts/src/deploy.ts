import { getContractAddress } from "@ethersproject/address";
import type { TransactionResponse } from "@ethersproject/abstract-provider";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import { PoolConfig, SALTS, Token } from "./config";
import { DEFAULTS, SWIM_FACTORY_ADDRESS } from "./config";

const ERC1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export const confirm = async (tx: Promise<TransactionResponse>) =>
  (await tx).wait();

export const isDeployed = async (address: string) =>
  // > 2 in case empty code gives a return of "0x"
  (await ethers.provider.getCode(address)).length > 2;

export const getSwimFactory = () => ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS);

export const getProxyAddress = async (salt: string) =>
  (await getSwimFactory()).determineProxyAddress(salt);

export const getLogicAddress = async (name: string) =>
  (await getSwimFactory()).determineAddress(
    (await ethers.getContractFactory(name)).bytecode,
    SALTS.logic[name as keyof typeof SALTS.logic]
  );

export const getTokenAddress = async (token: Token) =>
  (await getSwimFactory()).determineAddress(
    (await ethers.getContractFactory("ERC20Token"))
      .getDeployTransaction(token.name, token.symbol, token.decimals).data!,
    DEFAULTS.salt
  );

const getDeployedContract = async (name: string, address: string) => {
  if (!isDeployed(address))
    throw Error(`contract of type ${name} not yet deployed at ${address}`);
  return ethers.getContractAt(name, address);
}

const getProxySalt = (name: string, salt?: string) => {
  if (name === "Routing") {
    if (salt)
      throw Error("Can't specify salt for this type of Proxy");
    return SALTS.proxy.Routing;
  }
  else if (!salt)
    throw Error("Must specify salt for this type of proxy");
  return salt;
}

export const getProxy = async (name: string, salt?: string) =>
  getDeployedContract(name, await getProxyAddress(getProxySalt(name, salt)));

export const getLogic = async (name: string) =>
  getDeployedContract(name, await getLogicAddress(name));

export const getToken = async (token: Token) =>
  getDeployedContract("ERC20Token", await getTokenAddress(token));

export async function deployPoolAndRegister(
  pool: PoolConfig,
  governance: SignerWithAddress,
  governanceFeeRecipient: SignerWithAddress
): Promise<Contract> {
  const poolTokens = pool.tokens as readonly unknown[] as readonly {
    readonly address: string;
    readonly tokenNumber: number;
  }[];
  const tokenInfo = await Promise.all(
    poolTokens.map(async ({ address }) => {
      const token = await ethers.getContractAt("ERC20", address);
      return {
        symbol: await token.symbol(),
        decimals: await token.decimals(),
      };
    })
  );


  const lpDecimals = pool.lpDecimals ?? DEFAULTS.lpDecimals;
  const precision = pool.precision ?? DEFAULTS.precision;
  const poolProxy = await deployProxy(
    "Pool",
    [
      pool.lpName ?? "Swim " + tokenInfo.map(({ symbol }) => symbol).join("-") + "-Pool LP",
      pool.lpSymbol ?? tokenInfo.map(({ symbol }) => symbol).join("-") + "-LP",
      pool.lpSalt,
      lpDecimals,
      precision - lpDecimals,
      poolTokens.map((token) => token.address),
      tokenInfo.map(({ decimals }) => precision - decimals),
      pool.ampFactor ?? DEFAULTS.amp,
      pool.lpFee ?? DEFAULTS.lpFee,
      pool.govFee ?? DEFAULTS.governanceFee,
      governance.address,
      governanceFeeRecipient.address,
    ],
    pool.salt,
  );

  const routingProxy = await getProxy("Routing");
  for (let i = 0; i < poolTokens.length; ++i) {
    const poolToken = poolTokens[i];
    const filter = routingProxy.filters.TokenRegistered(poolToken.tokenNumber);
    const tokenReregisteredEvents = await routingProxy.queryFilter(filter);
    const currentlyRegisteredPool =
      tokenReregisteredEvents.length > 0
        ? tokenReregisteredEvents[tokenReregisteredEvents.length - 1]
        : "";
    if (currentlyRegisteredPool === poolProxy.address)
      await confirm(routingProxy.registerToken(
        poolToken.tokenNumber,
        poolToken.address,
        poolProxy.address,
        i + 1
      ));
  }

  return poolProxy;
}

export async function deployProxy(
  logicName: string,
  initializeArguments: readonly any[],
  salt?: string,
): Promise<Contract> {
  const swimFactory = await getSwimFactory();
  const logic = await getLogic(logicName);
  const initializeEncoded = logic.interface.encodeFunctionData("initialize", initializeArguments);
  salt = getProxySalt(logicName, salt);
  const proxyAddress = await getProxyAddress(salt);
  if (await isDeployed(proxyAddress)) {
    const slot = await ethers.provider.getStorageAt(proxyAddress, ERC1967_IMPLEMENTATION_SLOT);
    const actualLogic = ethers.utils.getAddress(slot);
    //console.log("0x" + slot.substring(2 + 2 * 12));
    //const actualLogic = ethers.utils.getAddress("0x" + slot.substring(2 + 2 * 12));
    if (actualLogic !== logic.address)
      throw Error(
        "Unexpected logic for Proxy " +
          proxyAddress +
          " - expected: " +
          logic.address +
          " but found: " +
          actualLogic
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
  }
  else
    await confirm(swimFactory.createProxy(logic.address, salt, initializeEncoded,{
      gasPrice: '200000000000'
    }));

  return new Contract(proxyAddress, logic.interface, logic.provider);
}

export async function deployLogic(name: string): Promise<Contract> {
  const logicAddress = await getLogicAddress(name);
  if (!(await isDeployed(logicAddress))) {
    //hacky workaround for a bug in hardhat that leads to incorrect gas estimation
    if ((await ethers.provider.detectNetwork()).chainId == 31337)
      await confirm(
        (await getSwimFactory())["create(bytes,bytes32)"](
          (await ethers.getContractFactory(name)).bytecode,
          SALTS.logic[name as keyof typeof SALTS.logic],
          { gasLimit: 10000000 }
        )
      );
    else
    await confirm(
      (await getSwimFactory())["create(bytes,bytes32)"](
        (await ethers.getContractFactory(name)).bytecode,
        SALTS.logic[name as keyof typeof SALTS.logic]
      )
    );
  }
  return getLogic(name);
}

export async function deployRegular(
  name: string,
  constructorArgs: readonly any[],
  call?: { readonly function: string; readonly arguments: readonly any[] }
): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory(name);
  const bytecodeWithConstructorArgs = contractFactory.getDeployTransaction(
    ...constructorArgs
  ).data!;
  const swimFactory = await getSwimFactory();
  const contractAddress = await swimFactory.determineAddress(
    bytecodeWithConstructorArgs,
    DEFAULTS.salt
  );

  if (!(await isDeployed(contractAddress))) {
    if (call)
      await confirm(swimFactory["create(bytes,bytes32,bytes)"](
        bytecodeWithConstructorArgs,
        DEFAULTS.salt,
        contractFactory.interface.encodeFunctionData(call.function, call.arguments),
        {
          gasPrice: '200000000000'
        }
      ));
    else
      await confirm(swimFactory["create(bytes,bytes32)"](
        bytecodeWithConstructorArgs,
        DEFAULTS.salt,
        {
          gasPrice: '200000000000'
        },
      ));
  }

  return ethers.getContractAt(name, contractAddress);
}

export const deployToken = async (token: Token, owner: SignerWithAddress): Promise<Contract> =>
  deployRegular("ERC20Token", [token.name, token.symbol, token.decimals], {
    function: "transferOwnership",
    arguments: [owner.address],
  });

export async function deploySwimFactory(
  owner: SignerWithAddress,
  factoryMnemonic?: string,
  presigned?: { readonly from: string; readonly maxCost: string; readonly signedTx: string; }
): Promise<void> {
  const checkOwner = async () => {
    const swimFactory = await getSwimFactory();
    const actualOwner = (await swimFactory.owner()) as string;
    if (actualOwner !== owner.address)
      throw Error(
        `Unexpected SwimFactory owner - expected: ${owner.address} but found: ${actualOwner}`
      );
  };

  const topUpGasOfFactoryDeployer = async (factoryDeployer: string, maxCost: BigNumber) => {
    const balance = await ethers.provider.getBalance(factoryDeployer);
    if (balance.lt(maxCost)) {
      const topUp = maxCost.sub(balance);
      if ((await owner.getBalance()).lt(topUp))
        throw Error("deployer has insufficient funds to send to factory deployer");
      //strictly speaking this could still fail because we have to pay for the
      // gas of the transaction too and then there might not be enough left...
      await confirm(owner.sendTransaction({ to: factoryDeployer, value: topUp }));
    }
  };

  if (await isDeployed(SWIM_FACTORY_ADDRESS))
    //console.log("SwimFactory was already deployed at:", SWIM_FACTORY_ADDRESS);
    await checkOwner();
  else if (typeof factoryMnemonic === "undefined") {
    if (typeof presigned === "undefined")
      throw Error("SwimFactory Mnemonic or presigned required for SwimFactory deployment");

    //deploy SwimFactory via presigned tx
    await topUpGasOfFactoryDeployer(presigned.from, BigNumber.from(presigned.maxCost));
    await confirm(ethers.provider.sendTransaction(presigned.signedTx));
    await checkOwner();
  } else {
    //deploy SwimFactory via factory mnemonic
    const factoryDeployer = ethers.Wallet.fromMnemonic(factoryMnemonic).connect(owner.provider!);

    if ((await factoryDeployer.getTransactionCount()) !== 0)
      throw Error(`SwimFactory deployer ${factoryDeployer.address} has nonzero transaction count`);

    const precalculatedAddress = getContractAddress({ from: factoryDeployer.address, nonce: 0 });
    if (precalculatedAddress !== SWIM_FACTORY_ADDRESS)
      throw Error(
        "Unexpected precalulated SwimFactory address - expected: " +
          SWIM_FACTORY_ADDRESS +
          " but got: " +
          precalculatedAddress
      );

    const swimFactoryFactory = (await ethers.getContractFactory("SwimFactory")).connect(
      factoryDeployer
    );

    const gasEstimate = factoryDeployer.estimateGas(
      swimFactoryFactory.getDeployTransaction(owner.address)
    );

    const { maxFeePerGas } = await ethers.getDefaultProvider().getFeeData();
    const maxCost = (await gasEstimate).mul(maxFeePerGas!);
    console.log("maxCost", maxCost);
    await topUpGasOfFactoryDeployer(factoryDeployer.address, maxCost);

    const swimFactory = await (await swimFactoryFactory.deploy(owner.address)).deployed();

    if (swimFactory.address !== SWIM_FACTORY_ADDRESS)
      throw Error(
        "Unexpected deployed SwimFactory address - expected: " +
          SWIM_FACTORY_ADDRESS +
          " but got: " +
          swimFactory.address
      );

    // const txHash = swimFactory.deployTransaction.hash;
    // const receipt = await network.provider.send("eth_getTransactionReceipt", [txHash]);
  }
}
