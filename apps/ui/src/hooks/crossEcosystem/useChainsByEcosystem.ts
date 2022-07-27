import type { ReadonlyRecord } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { ChainSpec, EvmSpec, SolanaSpec } from "../../config";
import { EcosystemId, Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export interface ChainsByEcosystem
  extends ReadonlyRecord<EcosystemId, ChainSpec | null> {
  readonly [EcosystemId.Solana]: SolanaSpec | null;
  readonly [EcosystemId.Ethereum]: EvmSpec | null;
  readonly [EcosystemId.Bnb]: EvmSpec | null;
  readonly [EcosystemId.Avalanche]: EvmSpec | null;
  readonly [EcosystemId.Polygon]: EvmSpec | null;
  readonly [EcosystemId.Aurora]: EvmSpec | null;
  readonly [EcosystemId.Fantom]: EvmSpec | null;
  readonly [EcosystemId.Karura]: EvmSpec | null;
  readonly [EcosystemId.Acala]: EvmSpec | null;
}

export const useChainsByEcosystem = (): ChainsByEcosystem => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [solana] = chains[Protocol.Solana];
  const [ethereum, bnb, avalanche, polygon, aurora, fantom, karura, acala] = [
    EcosystemId.Ethereum,
    EcosystemId.Bnb,
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

  return {
    [EcosystemId.Solana]: solana,
    [EcosystemId.Ethereum]: ethereum,
    [EcosystemId.Bnb]: bnb,
    [EcosystemId.Avalanche]: avalanche,
    [EcosystemId.Polygon]: polygon,
    [EcosystemId.Aurora]: aurora,
    [EcosystemId.Fantom]: fantom,
    [EcosystemId.Karura]: karura,
    [EcosystemId.Acala]: acala,
  };
};
