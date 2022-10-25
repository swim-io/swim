import type { ChainId } from "@certusone/wormhole-sdk";
import type { TokenProjectId } from "@swim-io/token-projects";
import type Decimal from "decimal.js";

import type { ChainConfig } from "./chain";
import type { PoolState } from "./pool";
import type { TokenDetails } from "./token";
import type { Tx } from "./tx";

export interface WrappedTokenInfo {
  readonly originChainId: ChainId;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly originAddress: Uint8Array;
  /** Ecosystem-specific format */
  readonly wrappedAddress: string;
}

export interface InitiatePortalTransferParams<Wallet> {
  readonly wallet: Wallet;
  readonly interactionId: string;
  readonly tokenProjectId: TokenProjectId;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly targetAddress: Uint8Array;
  readonly targetChainId: ChainId;
  readonly atomicAmount: string;
  readonly wrappedTokenInfo?: WrappedTokenInfo;
}

export interface CompletePortalTransferParams<Wallet> {
  readonly wallet: Wallet;
  readonly interactionId: string;
  readonly vaa: Uint8Array;
}

export interface InitiatePropellerParams<Wallet> {
  readonly wallet: Wallet;
  readonly interactionId: string;
  readonly sourceTokenId: TokenProjectId;
  readonly targetWormholeChainId: ChainId;
  readonly targetTokenNumber: number;
  readonly targetWormholeAddress: Uint8Array;
  readonly inputAmount: Decimal;
  readonly maxPropellerFeeAtomic: string;
  readonly gasKickStart: boolean;
}

export interface TxGeneratorResult<
  OriginalTx,
  T extends Tx<OriginalTx>,
  TxType extends string,
> {
  readonly tx: T;
  readonly type: TxType;
}

export abstract class Client<
  EcosystemId extends string,
  C extends ChainConfig,
  OriginalTx,
  TxType extends string,
  T extends Tx<OriginalTx>,
  Wallet,
> {
  public readonly ecosystemId: EcosystemId;
  protected readonly chainConfig: C;

  public constructor(ecosystemId: EcosystemId, chainConfig: C) {
    this.ecosystemId = ecosystemId;
    this.chainConfig = chainConfig;
  }

  public abstract getTx(id: string): Promise<T>;
  public abstract getTxs(ids: readonly string[]): Promise<readonly T[]>;
  /** Gas balance as a human decimal */
  public abstract getGasBalance(address: string): Promise<Decimal>;
  /** Token balance as a human decimal */
  public abstract getTokenBalance(
    owner: string,
    tokenDetails: TokenDetails,
  ): Promise<Decimal>;
  /** Token balances as human decimals */
  public abstract getTokenBalances(
    owner: string,
    tokenDetails: readonly TokenDetails[],
  ): Promise<readonly Decimal[]>;

  public abstract getPoolState(poolId: string): Promise<PoolState>;

  public abstract generateInitiatePortalTransferTxs(
    params: InitiatePortalTransferParams<Wallet>,
  ): AsyncGenerator<TxGeneratorResult<OriginalTx, T, TxType>>;
  public abstract generateCompletePortalTransferTxs(
    params: CompletePortalTransferParams<Wallet>,
  ): AsyncGenerator<TxGeneratorResult<OriginalTx, T, TxType>>;

  public abstract generateInitiatePropellerTxs(
    params: InitiatePropellerParams<Wallet>,
  ): AsyncGenerator<TxGeneratorResult<OriginalTx, T, TxType>>;
}
