/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TransactionResponse } from "@ethersproject/abstract-provider";
import { getContractAddress } from "@ethersproject/address";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import type { Pool } from "../typechain-types/contracts/Pool";
import type { Routing } from "../typechain-types/contracts/Routing";
import type { SwimFactory } from "../typechain-types/contracts/SwimFactory.sol/SwimFactory";
import type { ERC20Token } from "../typechain-types/contracts/test/ERC20Token";

import type { DeployedToken, PoolConfig, RoutingConfig, TestToken } from "./config";
import {
  DEFAULTS,
  GAS_TOKEN_DECIMALS,
  POOL_PRECISION,
  ROUTING_PRECISION,
  SALTS,
  SWIM_FACTORY_ADDRESS,
  SWIM_USD_ATTESTATION_ENCODEDVM,
  SWIM_USD_DECIMALS,
  SWIM_USD_SOLANA_ADDRESS,
  WORMHOLE_SOLANA_CHAIN_ID,
} from "./config";

const ERC1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

//the following should be part of ../typechain-types/contracts/Routing but isn't for whatever reason
enum RoutingGasTokenPriceMethod {
  FixedPrice = 0,
  UniswapOracle = 1,
}

export const confirm = async (tx: Promise<TransactionResponse>) => (await tx).wait();

export const isDeployed = async (address: string) =>
  // > 2 in case empty code gives a return of "0x"
  (await ethers.provider.getCode(address)).length > 2;

export const getSwimFactory = () =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS) as Promise<SwimFactory>;

export const getProxyAddress = async (saltOrName: string) =>
  (await getSwimFactory()).determineProxyAddress(
    saltOrName.startsWith("0x") ? saltOrName : getProxySalt(saltOrName)
  );

export const getLogicAddress = async (name: string) =>
  (await getSwimFactory()).determineAddress(
    (await ethers.getContractFactory(name)).bytecode,
    //I know just enough TypeScript to be dangerous...
    (SALTS.logic as { readonly [key: string]: string | undefined })[name] ?? DEFAULTS.salt
  );

export const getRegularAddress = async (name: string, constructorArgs: readonly any[]) => {
  const contractFactory = await ethers.getContractFactory(name);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const bytecodeWithConstructorArgs = contractFactory.getDeployTransaction(...constructorArgs)
    .data!;
  const swimFactory = await getSwimFactory();
  return swimFactory.determineAddress(bytecodeWithConstructorArgs, DEFAULTS.salt);
};

const testTokenToConstructorArgs = (token: TestToken) => [
  TOKEN_PROJECTS_BY_ID[token.id].displayName,
  TOKEN_PROJECTS_BY_ID[token.id].symbol,
  token.decimals,
];

export const getTokenAddress = (token: TestToken) =>
  getRegularAddress("ERC20Token", testTokenToConstructorArgs(token));

const getDeployedContract = async (name: string, address: string) => {
  if (!(await isDeployed(address)))
    throw Error(`contract of type ${name} not yet deployed at ${address}`);
  return ethers.getContractAt(name, address);
};

const getProxySalt = (name: string, salt?: string) => {
  if (name === "Routing" || name === "MockRoutingForPoolTests") {
    if (salt) throw Error("Can't specify salt for this type of Proxy");
    return SALTS.proxy.Routing;
  } else if (!salt) throw Error("Must specify salt for this type of proxy");
  return salt;
};

export const getProxy = async (name: string, salt?: string) =>
  getDeployedContract(name, await getProxyAddress(getProxySalt(name, salt)));

export const getLogic = async (name: string) =>
  getDeployedContract(name, await getLogicAddress(name));

export const getRegular = async (name: string, constructorArgs: readonly any[]) =>
  getDeployedContract(name, await getRegularAddress(name, constructorArgs));

export const getToken = async (token: TestToken) =>
  getDeployedContract("ERC20Token", await getTokenAddress(token)) as Promise<ERC20Token>;

export const getRoutingProxy = () => getProxy("Routing") as Promise<Routing>;

export const getPoolProxy = (salt: string) => getProxy("Pool", salt) as Promise<Pool>;

export interface PoolConfigDeployedTokens extends PoolConfig {
  readonly tokens: readonly DeployedToken[];
}

export async function completeSwimUsdAttestation(tokenBridgeAddress: string) {
  const tokenBridge = await ethers.getContractAt("ITokenBridge", tokenBridgeAddress);
  const attestationIsComplete = async () => {
    const swimUsdAddress = await tokenBridge.wrappedAsset(
      WORMHOLE_SOLANA_CHAIN_ID,
      SWIM_USD_SOLANA_ADDRESS
    );
    return swimUsdAddress && swimUsdAddress !== ethers.constants.AddressZero;
  };

  if (!(await attestationIsComplete()))
    await confirm(tokenBridge.createWrapped(SWIM_USD_ATTESTATION_ENCODEDVM));
  if (!(await attestationIsComplete()))
    throw Error(`Could not attest swimUSD using encoded attestation`);
}

export async function setupPropellerFees(routingConfig: RoutingConfig) {
  const routingProxy = await getRoutingProxy();
  const serviceFee = routingConfig.serviceFee ?? DEFAULTS.serviceFee;
  const currentFeeConfig = await routingProxy.propellerFeeConfig();
  if (!currentFeeConfig.serviceFee.eq(serviceFee))
    await confirm(routingProxy.adjustPropellerServiceFee(serviceFee));

  const gasPriceMethod = routingConfig.gasPriceMethod ?? DEFAULTS.gasPriceMethod;

  if ("uniswapPoolAddress" in gasPriceMethod) {
    const tokenNumber = TOKEN_PROJECTS_BY_ID[gasPriceMethod.intermediateTokenId].tokenNumber;
    if (tokenNumber === null)
      throw Error(
        `Token ${gasPriceMethod.intermediateTokenId} has not been assigned a tokenNumber yet`
      );
    const uniswapConfig = currentFeeConfig.uniswap;
    const tokenInfo = await routingProxy.tokenNumberMapping(tokenNumber);
    if (
      currentFeeConfig.method !== RoutingGasTokenPriceMethod.UniswapOracle ||
      uniswapConfig.swimPool !== tokenInfo.poolAddress ||
      uniswapConfig.swimIntermediateIndex !== tokenInfo.tokenIndexInPool ||
      uniswapConfig.uniswapPool !== gasPriceMethod.uniswapPoolAddress
    )
      await confirm(
        routingProxy.usePropellerUniswapOracle(
          tokenInfo.tokenAddress,
          gasPriceMethod.uniswapPoolAddress
        )
      );
  } else {
    //same x swimUSD / gastoken
    //if same decimals, then x * 10^18
    //for every decimal that swimUSD has price goes up by 10x because with e.g. 2 decimals 100
    // means 1 swimUSD whereas with 0 decimals 1 means 1 swimUSD
    //for every decimal gas token has, price goes down by 10x
    const fixedSwimUsdPerGasToken = BigNumber.from(gasPriceMethod.fixedSwimUsdPerGasToken).mul(
      BigNumber.from(10).pow(ROUTING_PRECISION + SWIM_USD_DECIMALS - GAS_TOKEN_DECIMALS)
    );

    if (
      currentFeeConfig.method !== RoutingGasTokenPriceMethod.FixedPrice ||
      !currentFeeConfig.fixedSwimUsdPerGasToken.eq(fixedSwimUsdPerGasToken)
    )
      await confirm(
        routingProxy.usePropellerFixedGasTokenPrice({
          value: fixedSwimUsdPerGasToken,
          decimals: ROUTING_PRECISION,
        })
      );
  }
}

export async function deployPoolAndRegister(
  pool: PoolConfigDeployedTokens,
  governance: SignerWithAddress,
  governanceFeeRecipient: SignerWithAddress
): Promise<Pool> {
  const tokenInfo = await Promise.all(
    pool.tokens.map(async ({ address }) => {
      const token = await ethers.getContractAt("ERC20", address);
      return {
        symbol: await token.symbol(),
        decimals: await token.decimals(),
      };
    })
  );

  const lpDecimals = pool.lpDecimals ?? DEFAULTS.lpDecimals;
  const initializeArguments = [
    pool.lpName ?? "Swim " + tokenInfo.map(({ symbol }) => symbol).join("-") + "-Pool LP",
    pool.lpSymbol ?? tokenInfo.map(({ symbol }) => symbol).join("-") + "-LP",
    pool.lpSalt,
    lpDecimals,
    pool.tokens.map((token) => token.address),
    tokenInfo.map(({ decimals }) => POOL_PRECISION - decimals),
    pool.ampFactor ?? DEFAULTS.amp,
    pool.lpFee ?? DEFAULTS.lpFee,
    pool.govFee ?? DEFAULTS.governanceFee,
    governance.address,
    governanceFeeRecipient.address,
  ];
  const poolProxy = (await deployProxy("Pool", initializeArguments, pool.salt)) as Pool;

  const routingProxy = await getRoutingProxy();
  for (let i = 0; i < pool.tokens.length; ++i) {
    const poolToken = pool.tokens[i];
    const tokenNumber = TOKEN_PROJECTS_BY_ID[poolToken.id].tokenNumber;
    if (tokenNumber === null)
      throw Error(`Token ${poolToken.id} has not been assigned a tokenNumber yet`);

    if ((await routingProxy.tokenNumberMapping(tokenNumber)).poolAddress !== poolProxy.address)
      await confirm(routingProxy.registerToken(tokenNumber, poolToken.address, poolProxy.address));
  }

  return poolProxy;
}

export async function deployProxy(
  logicName: string,
  initializeArguments: readonly any[],
  salt?: string
): Promise<Contract> {
  const swimFactory = await getSwimFactory();
  const logic = await getLogic(logicName);
  const initializeEncoded = logic.interface.encodeFunctionData("initialize", initializeArguments);
  // eslint-disable-next-line no-param-reassign
  salt = getProxySalt(logicName, salt);
  const proxyAddress = await getProxyAddress(salt);
  if (await isDeployed(proxyAddress)) {
    const slot = await ethers.provider.getStorageAt(proxyAddress, ERC1967_IMPLEMENTATION_SLOT);
    const actualLogic = ethers.utils.getAddress("0x" + slot.slice(2 + 2 * 12));
    if (actualLogic !== logic.address)
      throw Error(
        `Unexpected logic for Proxy ${proxyAddress} - ` +
          `expected: ${logic.address} but found ${actualLogic}`
      );

    try {
      //this tends to fail on various networks for various reasons, e.g. on BNB testnet you get
      const filter = swimFactory.filters.ContractCreated(proxyAddress);
      const deployEvents = await swimFactory.queryFilter(filter);
      if (deployEvents.length === 0) throw Error(`RPC Provider failed to return deploy event`);
      const [deployEvent] = deployEvents;
      const deployData = (await deployEvent.getTransaction()).data;
      const index = deployData.lastIndexOf(initializeEncoded.slice(2));
      const suffixIndex = index === -1 ? -1 : index + initializeEncoded.length - 2;
      if (
        index === -1 ||
        deployData.slice(suffixIndex) !== "0".repeat(deployData.length - suffixIndex)
      )
        console.warn(
          `Warning: Deployment transaction of proxy ${proxyAddress} for logic contract` +
            `${logic.address}$ was already deployed with different initialize arguments\n` +
            `expected:\n${initializeEncoded}\nbut full original calldata was:\n${deployData}`
        );
    } catch (e: any) {
      console.warn(
        `Warning: Couldn't compare initialize arguments from previous deploy transaction:\n` +
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
          `${e.message ?? e}`
      );
    }
  } else await confirm(swimFactory.createProxy(logic.address, salt, initializeEncoded));

  return new Contract(proxyAddress, logic.interface, logic.provider);
}

export async function deployLogic(name: string): Promise<Contract> {
  const logicAddress = await getLogicAddress(name);
  if (!(await isDeployed(logicAddress)))
    await confirm(
      (
        await getSwimFactory()
      )["create(bytes,bytes32)"](
        (
          await ethers.getContractFactory(name)
        ).bytecode,
        (SALTS.logic as { readonly [key: string]: string | undefined })[name] ?? DEFAULTS.salt,
        //hacky workaround for a bug in hardhat that leads to incorrect gas estimation
        (await ethers.provider.detectNetwork()).chainId == 31337 ? { gasLimit: 10000000 } : {}
      )
    );
  return getLogic(name);
}

export async function deployRegular(
  name: string,
  constructorArgs: readonly any[],
  call?: { readonly function: string; readonly arguments: readonly any[] }
): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory(name);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const bytecodeWithConstructorArgs = contractFactory.getDeployTransaction(...constructorArgs)
    .data!;
  const swimFactory = await getSwimFactory();
  const contractAddress = await swimFactory.determineAddress(
    bytecodeWithConstructorArgs,
    DEFAULTS.salt
  );
  if (!(await isDeployed(contractAddress))) {
    if (call)
      await confirm(
        swimFactory["create(bytes,bytes32,bytes)"](
          bytecodeWithConstructorArgs,
          DEFAULTS.salt,
          contractFactory.interface.encodeFunctionData(call.function, call.arguments)
        )
      );
    else
      await confirm(
        swimFactory["create(bytes,bytes32)"](bytecodeWithConstructorArgs, DEFAULTS.salt)
      );
  }

  return ethers.getContractAt(name, contractAddress);
}

export const deployToken = async (token: TestToken): Promise<ERC20Token> =>
  deployRegular("ERC20Token", testTokenToConstructorArgs(token)) as Promise<ERC20Token>;

export async function deploySwimFactory(
  owner: SignerWithAddress,
  factoryMnemonic?: string,
  presigned?: string
): Promise<SwimFactory> {
  const checkOwner = async () => {
    const swimFactory = await getSwimFactory();
    const actualOwner = await swimFactory.owner();
    if (actualOwner !== owner.address)
      throw Error(
        `Unexpected SwimFactory owner - expected: ${owner.address} but found: ${actualOwner}`
      );
  };

  const topUpGasOfFactoryDeployer = async (factoryDeployer: string, maxCost: BigNumber) => {
    const balance = await ethers.provider.getBalance(factoryDeployer);
    const ownerBalance = await owner.getBalance();
    if (balance.lt(maxCost)) {
      const topUp = maxCost.sub(balance);
      if (ownerBalance.lt(topUp))
        throw Error("deployer has insufficient funds to send to factory deployer");

      //console.log("topping up factory deployer by:", ethers.utils.formatEther(topUp));
      //strictly speaking this could still fail because we have to pay for the
      // gas of the transaction too and then there might not be enough left...
      await confirm(owner.sendTransaction({ to: factoryDeployer, value: topUp }));
    }
  };

  if (await isDeployed(SWIM_FACTORY_ADDRESS))
    //console.log("SwimFactory was already deployed at:", SWIM_FACTORY_ADDRESS);
    await checkOwner();
  else if (factoryMnemonic) {
    //deploy SwimFactory via factory mnemonic
    const factoryDeployer = ethers.Wallet.fromMnemonic(factoryMnemonic).connect(owner.provider!);

    if ((await factoryDeployer.getTransactionCount()) !== 0)
      throw Error(`SwimFactory deployer ${factoryDeployer.address} has nonzero transaction count`);

    const precalculatedAddress = getContractAddress({ from: factoryDeployer.address, nonce: 0 });
    if (precalculatedAddress !== SWIM_FACTORY_ADDRESS)
      throw Error(
        `Unexpected precalulated SwimFactory address - ` +
          `expected: ${SWIM_FACTORY_ADDRESS} but got: ${precalculatedAddress}`
      );

    const swimFactoryDeployTx = (await ethers.getContractFactory("SwimFactory"))
      .connect(factoryDeployer)
      .getDeployTransaction(owner.address);

    const gasEstimate = await factoryDeployer.estimateGas(swimFactoryDeployTx);
    const { maxFeePerGas } = await ethers.provider.getFeeData();
    const maxCost = gasEstimate.mul(maxFeePerGas!);

    await topUpGasOfFactoryDeployer(factoryDeployer.address, maxCost);

    const receipt = await confirm(
      factoryDeployer.sendTransaction({ ...swimFactoryDeployTx, gasLimit: gasEstimate })
    );

    if (receipt.contractAddress !== SWIM_FACTORY_ADDRESS)
      throw Error(
        `Unexpected deployed SwimFactory address - ` +
          `expected: ${SWIM_FACTORY_ADDRESS} but got: ${receipt.contractAddress}`
      );

    const leftoverBalance = await ethers.provider.getBalance(factoryDeployer.address);
    const refundCost = maxFeePerGas!.mul(21000);
    if (leftoverBalance.gt(refundCost))
      await confirm(
        factoryDeployer.sendTransaction({
          to: owner.address,
          value: leftoverBalance.sub(refundCost),
        })
      );
  } else if (presigned) {
    //deploy SwimFactory via presigned tx
    const presignedTx = ethers.utils.parseTransaction(presigned);
    const cost = presignedTx.gasLimit.mul(presignedTx.maxFeePerGas!);
    await topUpGasOfFactoryDeployer(presignedTx.from!, cost);
    await confirm(ethers.provider.sendTransaction(presigned));
    await checkOwner();
  } else throw Error("SwimFactory Mnemonic or presigned required for SwimFactory deployment");
  return getSwimFactory();
}
