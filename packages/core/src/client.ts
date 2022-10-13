import type { ChainId } from "@certusone/wormhole-sdk";

export interface WrappedTokenInfo {
  readonly originChainId: ChainId;
  /** Standardized Wormhole format, ie 32 bytes */
  readonly originAddress: Uint8Array;
}

export interface InitiateWormholeTransferParams<Wallet> {
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

export interface CompleteWormholeTransferParams<Wallet> {
  readonly interactionId: string;
  readonly vaa: Uint8Array;
  readonly wallet: Wallet;
}

export interface Client<Wallet> {
  readonly initiateWormholeTransfer: (
    params: InitiateWormholeTransferParams<Wallet>,
  ) => Promise<any>;

  readonly completeWormholeTransfer: (
    params: CompleteWormholeTransferParams<Wallet>,
  ) => Promise<any>;
}
