import shallow from "zustand/shallow.js";

import type { ChainSpec, EvmSpec, SolanaSpec } from "../../config";
import { EcosystemId, Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { ReadonlyRecord } from "../../utils";

export interface ChainsByEcosystem
  extends ReadonlyRecord<EcosystemId, ChainSpec | null> {
  readonly [SOLANA_ECOSYSTEM_ID]: SolanaSpec | null;
  readonly [ETHEREUM_ECOSYSTEM_ID]: EvmSpec | null;
  readonly [BNB_ECOSYSTEM_ID]: EvmSpec | null;
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
    ETHEREUM_ECOSYSTEM_ID,
    BNB_ECOSYSTEM_ID,
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
    [SOLANA_ECOSYSTEM_ID]: solana,
    [ETHEREUM_ECOSYSTEM_ID]: ethereum,
    [BNB_ECOSYSTEM_ID]: bnb,
    [EcosystemId.Avalanche]: avalanche,
    [EcosystemId.Polygon]: polygon,
    [EcosystemId.Aurora]: aurora,
    [EcosystemId.Fantom]: fantom,
    [EcosystemId.Karura]: karura,
    [EcosystemId.Acala]: acala,
  };
};
