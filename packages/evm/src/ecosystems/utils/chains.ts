interface ChainId {
  readonly mainnet: number;
  readonly testnet: number;
  readonly local?: number;
}
/** function to keep a narrower type while make sure the input is ChainId */
export const createChainId = <T extends ChainId>(chainId: T): T => chainId;
