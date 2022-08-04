import type { ReadonlyRecord } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../../config";
import { EcosystemId, getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useTokensByEcosystem = (): ReadonlyRecord<
  EcosystemId,
  readonly TokenSpec[]
> => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const filterTokensByEcosystem = (
    ecosystemId: EcosystemId,
  ): readonly TokenSpec[] =>
    tokens.filter((tokenSpec) =>
      getTokenDetailsForEcosystem(tokenSpec, ecosystemId),
    );

  return {
    [EcosystemId.Solana]: filterTokensByEcosystem(EcosystemId.Solana),
    [EcosystemId.Ethereum]: filterTokensByEcosystem(EcosystemId.Ethereum),
    [EcosystemId.Bnb]: filterTokensByEcosystem(EcosystemId.Bnb),
    [EcosystemId.Avalanche]: filterTokensByEcosystem(EcosystemId.Avalanche),
    [EcosystemId.Polygon]: filterTokensByEcosystem(EcosystemId.Polygon),
    [EcosystemId.Aurora]: filterTokensByEcosystem(EcosystemId.Aurora),
    [EcosystemId.Fantom]: filterTokensByEcosystem(EcosystemId.Fantom),
    [EcosystemId.Karura]: filterTokensByEcosystem(EcosystemId.Karura),
    [EcosystemId.Acala]: filterTokensByEcosystem(EcosystemId.Acala),
  };
};
