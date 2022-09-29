/** Adapted from @certusone/wormhole-sdk ChainId
 * https://pkg.go.dev/github.com/certusone/wormhole/node/pkg/vaa#ChainID
 */
export enum WormholeChainId {
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
  Aptos = 22,
}
