import type { TokenDetails, TxGeneratorResult } from "@swim-io/core";
import { Client } from "@swim-io/core";
import { atomicToHuman } from "@swim-io/utils";
import {
  APTOS_COIN,
  AptosAccount,
  CoinClient,
  AptosClient as SDKAptosClient,
} from "aptos";
import Decimal from "decimal.js";

import type {
  AptosChainConfig,
  AptosEcosystemId,
  AptosTx,
  AptosTxType,
} from "./protocol";
import { APTOS_ECOSYSTEM_ID } from "./protocol";
import type { AptosWalletAdapter } from "./walletAdapters";

interface GasScheduleV2 {
  readonly entries: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

export interface AptosClientOptions {
  readonly endpoint: string;
}

export class AptosClient extends Client<
  AptosEcosystemId,
  AptosChainConfig,
  any,
  AptosTxType,
  AptosTx,
  AptosWalletAdapter
> {
  private readonly sdkClient: SDKAptosClient;

  public constructor(
    chainConfig: AptosChainConfig,
    { endpoint }: AptosClientOptions,
  ) {
    super(APTOS_ECOSYSTEM_ID, chainConfig);
    this.sdkClient = new SDKAptosClient(endpoint);
  }

  public async getGasBalance(address: string): Promise<Decimal> {
    return this.getTokenBalance(address, { address: APTOS_COIN, decimals: 8 });
  }

  /**
   * @param {string} address - account address
   * @param {string} mintAddress - token address (or coinType in aptos SDK). e.g. "0x1::aptos_coin::AptosCoin"
   * @returns {Promise<Decimal>} token balance for this account
   */
  public async getTokenBalance(
    address: string,
    tokenDetails: TokenDetails,
  ): Promise<Decimal> {
    const account = new AptosAccount(undefined, address);
    const coinClient = new CoinClient(this.sdkClient);
    const balance = await coinClient.checkBalance(account, {
      coinType: tokenDetails.address,
    });
    return atomicToHuman(
      new Decimal(balance.toString()),
      tokenDetails.decimals,
    );
  }

  public async getGasPrice(): Promise<Decimal> {
    // from https://discord.com/channels/945856774056083548/946123778793029683/1022056705485459486
    const resource = await this.sdkClient.getAccountResource(
      "0x1",
      "0x1::gas_schedule::GasScheduleV2",
    );
    const { entries } = resource.data as GasScheduleV2;
    const minimum = entries.find(
      ({ key }) => key === "txn.min_price_per_gas_unit",
    );

    // there is also a max value
    // current values from https://fullnode.devnet.aptoslabs.com/v1/accounts/0x1/resource/0x1::gas_schedule::GasScheduleV2
    // {
    //   "key": "txn.min_price_per_gas_unit",
    //   "val": "100"
    // },
    // {
    //   "key": "txn.max_price_per_gas_unit",
    //   "val": "10000"
    // },

    if (!minimum) throw new Error(`No "txn.min_price_per_gas_unit" key found`);
    return new Decimal(minimum.value);
  }

  public getTx(): Promise<AptosTx> {
    throw new Error("Not implemented");
  }

  public getTxs(): Promise<readonly AptosTx[]> {
    throw new Error("Not implemented");
  }

  public getTokenBalances(): Promise<readonly Decimal[]> {
    throw new Error("Not implemented");
  }

  public generateInitiatePortalTransferTxs(): AsyncGenerator<
    TxGeneratorResult<any, AptosTx, AptosTxType>
  > {
    throw new Error("Not implemented");
  }

  public generateCompletePortalTransferTxs(): AsyncGenerator<
    TxGeneratorResult<any, AptosTx, AptosTxType>
  > {
    throw new Error("Not implemented");
  }

  public generateInitiatePropellerTxs(): AsyncGenerator<
    TxGeneratorResult<any, AptosTx, AptosTxType>,
    any,
    AptosTxType
  > {
    throw new Error("Not implemented");
  }
}
