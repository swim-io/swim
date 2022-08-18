import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { ChainSpec, EcosystemId, EvmSpec, SolanaSpec } from "../../config";
import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export interface ChainsByEcosystem
  extends ReadonlyRecord<EcosystemId, ChainSpec | null> {
  readonly [SOLANA_ECOSYSTEM_ID]: SolanaSpec | null;
  readonly [EvmEcosystemId.Ethereum]: EvmSpec | null;
  readonly [EvmEcosystemId.Bnb]: EvmSpec | null;
  readonly [EvmEcosystemId.Avalanche]: EvmSpec | null;
  readonly [EvmEcosystemId.Polygon]: EvmSpec | null;
  readonly [EvmEcosystemId.Aurora]: EvmSpec | null;
  readonly [EvmEcosystemId.Fantom]: EvmSpec | null;
  readonly [EvmEcosystemId.Karura]: EvmSpec | null;
  readonly [EvmEcosystemId.Acala]: EvmSpec | null;
}

export const useChainsByEcosystem = (): ChainsByEcosystem => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [solana] = chains[Protocol.Solana];
  const [ethereum, bnb, avalanche, polygon, aurora, fantom, karura, acala] = [
    EvmEcosystemId.Ethereum,
    EvmEcosystemId.Bnb,
    EvmEcosystemId.Avalanche,
    EvmEcosystemId.Polygon,
    EvmEcosystemId.Aurora,
    EvmEcosystemId.Fantom,
    EvmEcosystemId.Karura,
    EvmEcosystemId.Acala,
  ].map(
    (ecosystemId) =>
      chains[Protocol.Evm].find((chain) => chain.ecosystem === ecosystemId) ??
      null,
  );

  return {
    [SOLANA_ECOSYSTEM_ID]: solana,
    [EvmEcosystemId.Ethereum]: ethereum,
    [EvmEcosystemId.Bnb]: bnb,
    [EvmEcosystemId.Avalanche]: avalanche,
    [EvmEcosystemId.Polygon]: polygon,
    [EvmEcosystemId.Aurora]: aurora,
    [EvmEcosystemId.Fantom]: fantom,
    [EvmEcosystemId.Karura]: karura,
    [EvmEcosystemId.Acala]: acala,
  };
};
