import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import type { ChainConfig } from "@swim-io/core/types";
import type { EvmChainConfig } from "@swim-io/evm";
import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaChainConfig } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import shallow from "zustand/shallow.js";

import type { EcosystemId } from "../../config";
import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export interface ChainsByEcosystem
  extends ReadonlyRecord<EcosystemId, ChainConfig | null> {
  readonly [SOLANA_ECOSYSTEM_ID]: SolanaChainConfig | null;
  readonly [EvmEcosystemId.Ethereum]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Bnb]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Avalanche]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Polygon]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Aurora]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Fantom]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Karura]: EvmChainConfig | null;
  readonly [EvmEcosystemId.Acala]: EvmChainConfig | null;
}

export const useChainsByEcosystem = (): ChainsByEcosystem => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [aptos] = chains[Protocol.Aptos];
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
    [APTOS_ECOSYSTEM_ID]: aptos,
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
