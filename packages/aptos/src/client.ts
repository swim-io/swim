import type { PoolState, TokenDetails, TxGeneratorResult } from "@swim-io/core";
import { Client } from "@swim-io/core";
import { atomicToHuman, findOrThrow } from "@swim-io/utils";
import {
  APTOS_COIN,
  ApiError,
  AptosAccount,
  AptosClient as SDKAptosClient,
} from "aptos";
import Decimal from "decimal.js";

import { DAO_FEE_DECIMALS, FEE_DECIMALS, getPoolBalances } from "./liquidswap";
import type { PoolResource } from "./liquidswap";
import type {
  AptosChainConfig,
  AptosEcosystemId,
  AptosTx,
  AptosTxType,
} from "./protocol";
import { APTOS_ECOSYSTEM_ID } from "./protocol";
import type { CoinInfoResource, CoinResource, GasScheduleV2 } from "./types";
import { getCoinInfoSupply, getCoinInfoType, getCoinStoreType } from "./utils";
import type { AptosWalletAdapter } from "./walletAdapters";

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

    try {
      const resource = (await this.sdkClient.getAccountResource(
        account.address(),
        getCoinStoreType(tokenDetails.address),
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

  public async getPoolState(poolId: string): Promise<PoolState> {
    const { address, owner, lpTokenId, tokenIds } = findOrThrow(
      this.chainConfig.pools,
      (poolConfig) => poolConfig.id === poolId,
    );
    const lpToken = findOrThrow(
      this.chainConfig.tokens,
      (token) => token.id === lpTokenId,
    );
    const [tokenX, tokenY]: readonly TokenDetails[] = tokenIds.map(
      (tokenId) => {
        if (/swimusd$/.test(tokenId)) return this.chainConfig.swimUsdDetails; // TODO is there a better way to do this?

        return findOrThrow(
          this.chainConfig.tokens,
          (token) => token.id === tokenId,
        ).nativeDetails;
      },
    );

    const [lpTokenSupplyResponse, poolResponse] = await Promise.all([
      this.sdkClient.getAccountResource(
        owner,
        getCoinInfoType(lpToken.nativeDetails.address),
      ),
      this.sdkClient.getAccountResource(owner, address),
    ]);

    const totalLpSupply = getCoinInfoSupply(
      lpTokenSupplyResponse as CoinInfoResource,
    );
    const pool = poolResponse as PoolResource;
    const balances = getPoolBalances(pool, [tokenX, tokenY]);

    return {
      isPaused: false, // TODO ? https://exsphere.slack.com/archives/C03SQTXMFT9/p1666390318707959?thread_ts=1666352227.333479&cid=C03SQTXMFT9
      ampFactor: new Decimal("1"), // no ampFactor for liquidswap pool ?
      lpFee: atomicToHuman(new Decimal(pool.data.fee), FEE_DECIMALS),
      governanceFee: atomicToHuman(
        new Decimal(pool.data.dao_fee),
        DAO_FEE_DECIMALS,
      ),
      balances,
      totalLpSupply,
    };
  }
}
