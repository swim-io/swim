/** Adapted from @certusone/wormhole-sdk ChainId
 * https://pkg.go.dev/github.com/certusone/wormhole/node/pkg/vaa#ChainID
 */
export const enum WormholeChainId {
  Solana = 1,
  Ethereum = 2,
  Terra = 3,
  Bnb = 4,
  Polygon = 5, // NOTE: in some parts of the code, the listed order is swapped with Avalanche but ID is the same
  Avalanche = 6,
  Oasis = 7,
  Algorand = 8,
  Aurora = 9,
  Fantom = 10,
  Karura = 11,
  Acala = 12,
  Klaytn = 13,
}

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
