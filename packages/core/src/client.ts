import type { ChainId } from "@certusone/wormhole-sdk";
import type { TokenProjectId } from "@swim-io/token-projects";
import type Decimal from "decimal.js";

import type { ChainConfig } from "./chain";
import type { TokenDetails } from "./token";
import type { Tx } from "./tx";

export interface WrappedTokenInfo {
  readonly originChainId: ChainId;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly originAddress: Uint8Array;
  /** Ecosystem-specific format */
  readonly wrappedAddress: string;
}

export interface InitiateWormholeTransferParams<Wallet> {
  readonly atomicAmount: string;
  readonly interactionId: string;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly targetAddress: Uint8Array;
  readonly targetChainId: ChainId;
  readonly tokenProjectId: TokenProjectId;
  readonly wallet: Wallet;
  readonly wrappedTokenInfo?: WrappedTokenInfo;
}

export interface CompleteWormholeTransferParams<Wallet> {
  readonly interactionId: string;
  readonly vaa: Uint8Array;
  readonly wallet: Wallet;
}

export abstract class Client<
  EcosystemId extends string,
  C extends ChainConfig,
  T extends Tx,
  Wallet,
> {
  public readonly ecosystemId: EcosystemId;
  protected readonly chainConfig: C;

  public constructor(ecosystemId: EcosystemId, chainConfig: C) {
    this.ecosystemId = ecosystemId;
    this.chainConfig = chainConfig;
  }

  public abstract getTx(id: string): Promise<T | null>;
  public abstract getTxs(
    ids: readonly string[],
  ): Promise<readonly (T | null)[]>;
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
  public abstract initiateWormholeTransfer(
    params: InitiateWormholeTransferParams<Wallet>,
  ): Promise<any>;

  public abstract completeWormholeTransfer(
    params: CompleteWormholeTransferParams<Wallet>,
  ): Promise<any>;
}
