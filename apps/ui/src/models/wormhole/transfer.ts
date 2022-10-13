import type { ChainId } from "@certusone/wormhole-sdk";
import type { WrappedTokenInfo } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import type Decimal from "decimal.js";

import { ECOSYSTEM_LIST } from "../../config";

import { formatWormholeAddress } from "./formatWormholeAddress";

export interface TxResult {
  readonly chainId: ChainId;
  readonly txId: string;
}

export interface WormholeTokenDetails {
  readonly chainId: ChainId;
  readonly address: string;
  readonly decimals: number;
}

export interface WormholeToken {
  readonly symbol: string;
  readonly displayName: string;
  readonly logo: string;
  readonly coinGeckoId: string;
  readonly nativeDetails: WormholeTokenDetails;
  readonly wrappedDetails: readonly WormholeTokenDetails[];
}

export interface WormholeTransfer {
  readonly interactionId: string;
  readonly value: Decimal;
  readonly sourceDetails: WormholeTokenDetails;
  readonly targetDetails: WormholeTokenDetails;
  readonly nativeDetails: WormholeTokenDetails;
  readonly onTxResult: (txResult: TxResult) => any;
}

export const getWrappedTokenInfoFromNativeDetails = (
  sourceChainId: ChainId,
  nativeDetails: WormholeTokenDetails,
): WrappedTokenInfo | undefined => {
  if (sourceChainId === nativeDetails.chainId) {
    return undefined;
  }
  const nativeEcosystem = findOrThrow(
    ECOSYSTEM_LIST,
    (ecosystem) => ecosystem.wormholeChainId === nativeDetails.chainId,
  );
  return {
    originAddress: formatWormholeAddress(
      nativeEcosystem.protocol,
      nativeDetails.address,
    ),
    originChainId: nativeDetails.chainId,
  };
};
