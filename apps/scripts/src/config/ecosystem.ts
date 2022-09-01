import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaEcosystemId } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

export type EcosystemId = SolanaEcosystemId | EvmEcosystemId;

export const enum Protocol {
  Solana = "solana-protocol",
  Evm = "evm",
}

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case SOLANA_ECOSYSTEM_ID:
    case EvmEcosystemId.Ethereum:
    case EvmEcosystemId.Bnb:
    case EvmEcosystemId.Avalanche:
    case EvmEcosystemId.Polygon:
    case EvmEcosystemId.Aurora:
    case EvmEcosystemId.Fantom:
    case EvmEcosystemId.Karura:
      return true;
    case EvmEcosystemId.Acala:
      return !!process.env.REACT_APP_ENABLE_ACALA;
    default:
      return false;
  }
};
