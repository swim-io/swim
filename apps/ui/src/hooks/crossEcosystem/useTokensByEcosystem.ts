import shallow from "zustand/shallow.js";

import type { EcosystemId, TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { ReadonlyRecord } from "../../utils";

export const useTokensByEcosystem = (): ReadonlyRecord<
  EcosystemId,
  readonly TokenSpec[]
> => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const filterTokensByEcosystem = (
    ecosystem: EcosystemId,
  ): readonly TokenSpec[] =>
    tokens.filter((tokenSpec) => tokenSpec.detailsByEcosystem.get(ecosystem));

  return {
    solana: filterTokensByEcosystem("solana"),
    ethereum: filterTokensByEcosystem("ethereum"),
    bnb: filterTokensByEcosystem("bnb"),
    // [EcosystemId.Avalanche]: filterTokensByEcosystem(EcosystemId.Avalanche),
    // [EcosystemId.Polygon]: filterTokensByEcosystem(EcosystemId.Polygon),
    // [EcosystemId.Aurora]: filterTokensByEcosystem(EcosystemId.Aurora),
    // [EcosystemId.Fantom]: filterTokensByEcosystem(EcosystemId.Fantom),
    // [EcosystemId.Karura]: filterTokensByEcosystem(EcosystemId.Karura),
    // [EcosystemId.Acala]: filterTokensByEcosystem(EcosystemId.Acala),
  };
};
