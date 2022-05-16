import { BscscanProvider } from "@ethers-ancillary/bsc";
import Decimal from "decimal.js";
import { ethers } from "ethers";

import type { EvmEcosystemId, EvmSpec } from "../../config";
import { EcosystemId, Env } from "../../config";
import { isNotNull } from "../../utils";

import { LocalnetProvider } from "./LocalnetProvider";
import { MoralisProvider } from "./MoralisProvider";
import { Erc20Factory } from "./erc20";

type EtherscanProvider = ethers.providers.EtherscanProvider;
type TransactionReceipt = ethers.providers.TransactionReceipt;
type TransactionResponse = ethers.providers.TransactionResponse;

export type Provider = MoralisProvider | EtherscanProvider | LocalnetProvider;

// TODO: Use proper endpoints via env
//TODO strings below are a quick hack to get past explicit undefined checks.
const AVALANCHE_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";
const POLYGON_RPC_URL = "https://rpc-mumbai.matic.today";
const BSC_MAINNET_RPC_URL = process.env.REACT_APP_BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/";
const BSC_TESTNET_RPC_URL = process.env.REACT_APP_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || "";
const MORALIS_ID = "Swim UI";

/**
 * Network names from:
 * https://github.com/ethers-io/ethers.js/blob/7b134bd5c9f07f60b2e38b110268042e10f68174/packages/providers/src.ts/alchemy-provider.ts#L57-L93
 */
const getEtherscanNetwork = (env: Env): ethers.providers.Networkish => {
  switch (env) {
    case Env.Mainnet:
      return "homestead";
    case Env.Devnet:
      return "goerli";
    default:
      throw new Error(`Etherscan does not support ${env}`);
  }
};

/**
 * Network names from:
 * https://github.com/ethers-io/ancillary-bsc/blob/559783304776d82da943fba2be43bfe99e93afc3/src.ts/bscscan-provider.ts#L15-L23
 */
const getBscscanNetwork = (env: Env): ethers.providers.Networkish => {
  switch (env) {
    case Env.Mainnet:
      return "bsc-mainnet";
    case Env.Devnet:
      return "bsc-testnet";
    default:
      throw new Error(`Bscscan does not support ${env}`);
  }
};

const getBscRpcUrl = (env: Env): string => {
  switch (env) {
    case Env.Mainnet:
      if (BSC_MAINNET_RPC_URL === undefined) {
        throw new Error(`BSC_MAINNET_RPC_URL is not set`);
      }
      return BSC_MAINNET_RPC_URL;
    case Env.Devnet:
      if (BSC_TESTNET_RPC_URL === undefined) {
        throw new Error(`BSC_TESTNET_RPC_URL is not set`);
      }
      return BSC_TESTNET_RPC_URL;
    default:
      throw new Error(`${env} not supported by Moralis Provider`);
  }
};

export class EvmConnection {
  public provider: Provider;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txReceiptCache: Map<string, TransactionReceipt>;

  constructor(env: Env, chainSpec: EvmSpec) {
    this.provider = EvmConnection.getIndexerProvider(env, chainSpec);
    this.txReceiptCache = new Map();
  }

  public static getIndexerProvider(
    env: Env,
    { ecosystem, rpcUrls }: EvmSpec,
  ): Provider {
    switch (env) {
      case Env.Mainnet:
      case Env.Devnet:
        return EvmConnection.getPublicEvmIndexerProvider(env, ecosystem);
      default: {
        return new LocalnetProvider(rpcUrls[0]);
      }
    }
  }

  private static getPublicEvmIndexerProvider(
    env: Env,
    ecosystemId: EvmEcosystemId,
  ): Provider {

    switch (ecosystemId) {
      case EcosystemId.Ethereum:
        return new ethers.providers.EtherscanProvider(
          getEtherscanNetwork(env),
          ETHERSCAN_API_KEY,
        );
      case EcosystemId.Bsc:
        try {
          return new MoralisProvider(env, getBscRpcUrl(env), MORALIS_ID);
        } catch (error) {
          // Fall back to basic Bscscan provider with no API key
          // This is useful eg for coding challenges
          if (process.env.NODE_ENV !== "development") {
            throw error;
          }
          return new BscscanProvider(getBscscanNetwork(env));
        }
      case EcosystemId.Avalanche: {
        return new LocalnetProvider(AVALANCHE_RPC_URL);
      }
      case EcosystemId.Polygon: {
        return new LocalnetProvider(POLYGON_RPC_URL);
      }
      default:
        throw new Error(`Unsupported EVM ecosystem: ${ecosystemId}`);
    }
  }

  public async getHistory(
    address: string,
  ): Promise<readonly TransactionResponse[] | null> {
    // NOTE: ethers does not use strict mode so we widen the type here
    const history = (await this.provider.getHistory(address)) as
      | readonly (TransactionResponse | null)[]
      | null;
    return history?.filter(isNotNull) ?? null;
  }

  public async getTxReceipt(
    txResponse: TransactionResponse | null,
  ): Promise<TransactionReceipt | null> {
    if (!txResponse) {
      return null;
    }

    const knownTx = this.txReceiptCache.get(txResponse.hash);
    if (knownTx !== undefined) {
      return knownTx;
    }

    // NOTE: The .wait method implements a lot of useful features like retries and exponential backoff.
    // So we prioritize it if available.
    if (typeof txResponse.wait === "function") {
      const maybeTxReceipt = (await txResponse.wait()) as
        | ethers.providers.TransactionReceipt
        | null
        | undefined;
      if (maybeTxReceipt) {
        this.txReceiptCache.set(txResponse.hash, maybeTxReceipt);
        return maybeTxReceipt;
      }
    }

    // NOTE: ethers does not use strict mode so we widen the type here
    // This seems to be more reliable than txResponse.wait()
    const maybeTxReceipt = (await this.provider.waitForTransaction(
      txResponse.hash,
      1,
    )) as ethers.providers.TransactionReceipt | null | undefined;
    if (maybeTxReceipt) {
      this.txReceiptCache.set(txResponse.hash, maybeTxReceipt);
      return maybeTxReceipt;
    }

    return null;
  }

  public async getTxReceiptOrThrow(
    txResponse: TransactionResponse,
  ): Promise<ethers.providers.TransactionReceipt> {
    const txReceipt = await this.getTxReceipt(txResponse);
    if (txReceipt === null) {
      throw new Error(`Transaction not found: ${txResponse.hash}`);
    }
    return txReceipt;
  }

  public async getEthBalance(walletAddress: string): Promise<Decimal> {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return new Decimal(balance.toString());
    } catch {
      return new Decimal(0);
    }
  }

  public async getErc20Balance(
    contractAddress: string,
    walletAddress: string,
  ): Promise<Decimal | null> {
    const erc20Contract = Erc20Factory.connect(contractAddress, this.provider);
    try {
      const balance = await erc20Contract.balanceOf(walletAddress);
      return new Decimal(balance.toString());
    } catch {
      return null;
    }
  }
}
