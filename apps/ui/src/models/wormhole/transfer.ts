import type { WrappedTokenInfo } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import type Decimal from "decimal.js";

import type { SupportedChainId } from "../../config";
import { ECOSYSTEM_LIST } from "../../config";

import { formatWormholeAddress } from "./formatWormholeAddress";

export interface TxResult {
  readonly chainId: SupportedChainId;
  readonly txId: string;
}

export interface WormholeTokenDetails {
  readonly chainId: SupportedChainId;
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
  sourceChainId: SupportedChainId,
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
