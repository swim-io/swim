import type { ChainSpec, CosmosSpec, EvmSpec, SolanaSpec } from "../../config";
import { EcosystemId, Protocol } from "../../config";
import { useConfig } from "../../contexts";
import type { ReadonlyRecord } from "../../utils";

export interface ChainsByEcosystem
  extends ReadonlyRecord<EcosystemId, ChainSpec | null> {
  readonly [EcosystemId.Solana]: SolanaSpec | null;
  readonly [EcosystemId.Ethereum]: EvmSpec | null;
  readonly [EcosystemId.Bsc]: EvmSpec | null;
  readonly [EcosystemId.Terra]: CosmosSpec | null;
  readonly [EcosystemId.Avalanche]: EvmSpec | null;
  readonly [EcosystemId.Polygon]: EvmSpec | null;
  readonly [EcosystemId.Aurora]: EvmSpec | null;
  readonly [EcosystemId.Fantom]: EvmSpec | null;
  readonly [EcosystemId.Karura]: EvmSpec | null;
  readonly [EcosystemId.Acala]: EvmSpec | null;
}

export const useChainsByEcosystem = (): ChainsByEcosystem => {
  const { chains } = useConfig();
  const [solana] = chains[Protocol.Solana];
  const [ethereum, bsc, avalanche, polygon, aurora, fantom, acala] = [
    EcosystemId.Ethereum,
    EcosystemId.Bsc,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
    EcosystemId.Aurora,
    EcosystemId.Fantom,
    EcosystemId.Karura,
    EcosystemId.Acala,
  ].map(
    (ecosystemId) =>
      chains[Protocol.Evm].find((chain) => chain.ecosystem === ecosystemId) ??
      null,
  );
  const terra =
    chains[Protocol.Cosmos].find(
      // (chain) => chain.ecosystem === EcosystemId.Terra, // TODO: Enable when we have more than one Cosmos chain
      Boolean,
    ) ?? null;

  return {
    [EcosystemId.Solana]: solana,
    [EcosystemId.Ethereum]: ethereum,
    [EcosystemId.Bsc]: bsc,
    [EcosystemId.Terra]: terra,
    [EcosystemId.Avalanche]: avalanche,
    [EcosystemId.Polygon]: polygon,
    [EcosystemId.Aurora]: aurora,
    [EcosystemId.Fantom]: fantom,
    [EcosystemId.Karura]: acala,
    [EcosystemId.Acala]: acala,
  };
};
