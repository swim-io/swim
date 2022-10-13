import type { ChainId } from "@certusone/wormhole-sdk";
import type Decimal from "decimal.js";

import type { ChainConfig } from "./chain";
import type { TokenDetails } from "./token";
import type { Tx } from "./tx";

export interface WrappedTokenInfo {
  readonly originChainId: ChainId;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly originAddress: Uint8Array;
}

export interface InitiatePortalTransferParams<Wallet> {
  readonly atomicAmount: string;
  readonly interactionId: string;
  /** Ecosystem-specific address format */
  readonly sourceAddress: string;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly targetAddress: Uint8Array;
  readonly targetChainId: ChainId;
  readonly wallet: Wallet;
  readonly wrappedTokenInfo?: WrappedTokenInfo;
}

export interface CompletePortalTransferParams<Wallet> {
  readonly interactionId: string;
  readonly vaa: Uint8Array;
  readonly wallet: Wallet;
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
  public abstract generateInitiatePortalTransferTxs(
    params: InitiatePortalTransferParams<Wallet>,
  ): AsyncGenerator<TxGeneratorResult<OriginalTx, T, TxType>>;

  public abstract generateCompletePortalTransferTxs(
    params: CompletePortalTransferParams<Wallet>,
  ): AsyncGenerator<TxGeneratorResult<OriginalTx, T, TxType>>;
}
