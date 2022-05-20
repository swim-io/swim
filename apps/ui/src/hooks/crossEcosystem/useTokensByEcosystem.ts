import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { useConfig } from "../../contexts";
import type { ReadonlyRecord } from "../../utils";

export const useTokensByEcosystem = (): ReadonlyRecord<
  EcosystemId,
  readonly TokenSpec[]
> => {
  const { tokens } = useConfig();
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
    [EcosystemId.Aurora]: filterTokensByEcosystem(EcosystemId.Aurora),
    [EcosystemId.Fantom]: filterTokensByEcosystem(EcosystemId.Fantom),
    [EcosystemId.Acala]: filterTokensByEcosystem(EcosystemId.Acala),
  };
};
