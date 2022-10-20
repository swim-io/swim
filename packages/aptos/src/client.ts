import type { TokenDetails } from "@swim-io/core";
import { Client } from "@swim-io/core";
import { atomicToHuman } from "@swim-io/utils";
import type { Types } from "aptos";
import {
  APTOS_COIN,
  ApiError,
  AptosAccount,
  AptosClient as SDKAptosClient,
} from "aptos";
import Decimal from "decimal.js";

import type { AptosChainConfig, AptosEcosystemId, AptosTx } from "./protocol";
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

interface CoinResource {
  readonly data: { readonly coin: { readonly value: string } };
  readonly type: Types.MoveStructTag;
}

export class AptosClient extends Client<
  AptosEcosystemId,
  AptosChainConfig,
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

    try {
      const resource = (await this.sdkClient.getAccountResource(
        account.address(),
        tokenDetails.address,
      )) as CoinResource;
      return atomicToHuman(
        new Decimal(resource.data.coin.value),
        tokenDetails.decimals,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404)
        return new Decimal("0");

      throw error;
    }
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

  public initiateWormholeTransfer(): Promise<void> {
    throw new Error("Not implemented");
  }

  public completeWormholeTransfer(): Promise<void> {
    throw new Error("Not implemented");
  }
}
