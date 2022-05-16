import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";
import type { ReadonlyRecord } from "../../utils";

export const useTokensByEcosystem = (): ReadonlyRecord<
  EcosystemId,
  readonly TokenSpec[]
> => {
  const { tokens } = useEnvironmentStore(selectConfig);
  const filterTokensByEcosystem = (
    ecosystem: EcosystemId,
  ): readonly TokenSpec[] =>
    tokens.filter((tokenSpec) => tokenSpec.detailsByEcosystem.get(ecosystem));

  return {
    [EcosystemId.Solana]: filterTokensByEcosystem(EcosystemId.Solana),
    [EcosystemId.Ethereum]: filterTokensByEcosystem(EcosystemId.Ethereum),
    [EcosystemId.Terra]: filterTokensByEcosystem(EcosystemId.Terra),
    [EcosystemId.Bsc]: filterTokensByEcosystem(EcosystemId.Bsc),
    [EcosystemId.Avalanche]: filterTokensByEcosystem(EcosystemId.Avalanche),
    [EcosystemId.Polygon]: filterTokensByEcosystem(EcosystemId.Polygon),
  };
};
