import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useTokensByEcosystem = (): ReadonlyRecord<
  EcosystemId,
  readonly TokenConfig[]
> => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const filterTokensByEcosystem = (
    ecosystemId: EcosystemId,
  ): readonly TokenConfig[] =>
    tokens.filter((tokenConfig) =>
      getTokenDetailsForEcosystem(tokenConfig, ecosystemId),
    );

  return {
    [SOLANA_ECOSYSTEM_ID]: filterTokensByEcosystem(SOLANA_ECOSYSTEM_ID),
    [EvmEcosystemId.Ethereum]: filterTokensByEcosystem(EvmEcosystemId.Ethereum),
    [EvmEcosystemId.Bnb]: filterTokensByEcosystem(EvmEcosystemId.Bnb),
    [EvmEcosystemId.Avalanche]: filterTokensByEcosystem(
      EvmEcosystemId.Avalanche,
    ),
    [EvmEcosystemId.Polygon]: filterTokensByEcosystem(EvmEcosystemId.Polygon),
    [EvmEcosystemId.Aurora]: filterTokensByEcosystem(EvmEcosystemId.Aurora),
    [EvmEcosystemId.Fantom]: filterTokensByEcosystem(EvmEcosystemId.Fantom),
    [EvmEcosystemId.Karura]: filterTokensByEcosystem(EvmEcosystemId.Karura),
    [EvmEcosystemId.Acala]: filterTokensByEcosystem(EvmEcosystemId.Acala),
  };
};
