import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { Wallets } from "../../models";

export const MOCK_WALLETS = {
  [EvmEcosystemId.Acala]: { address: null },
  [EvmEcosystemId.Aurora]: { address: null },
  [EvmEcosystemId.Avalanche]: { address: null },
  [EvmEcosystemId.Bnb]: {
    address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  },
  [EvmEcosystemId.Ethereum]: {
    address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  },
  [EvmEcosystemId.Fantom]: { address: null },
  [EvmEcosystemId.Karura]: { address: null },
  [EvmEcosystemId.Polygon]: { address: null },
  [SOLANA_ECOSYSTEM_ID]: {
    address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    connected: true,
  },
} as Wallets;
