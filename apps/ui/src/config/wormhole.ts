import { WormholeChainId } from "@swim-io/wormhole";

// We currently use this with Wormhole SDK’s getSignedVAAWithRetry function.
// By default this function retries every 1 second.
export const getWormholeRetries = (chainId: WormholeChainId): number => {
  switch (chainId) {
    // Ethereum requires up to 95 confirmations for finality, or roughly 19 minutes
    case WormholeChainId.Ethereum:
      return 1200;
    // Polygon requires 512 confirmations for finality, or roughly 18 minutes.
    case WormholeChainId.Polygon:
      return 1200;
    default:
      return 300;
  }
};
