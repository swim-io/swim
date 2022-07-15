import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

import type { Wallets } from "../../models";

export const MOCK_WALLETS = {
  // [EcosystemId.Acala]: { address: null },
  // [EcosystemId.Aurora]: { address: null },
  // [EcosystemId.Avalanche]: { address: null },
  [BNB_ECOSYSTEM_ID]: { address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1" },
  [ETHEREUM_ECOSYSTEM_ID]: {
    address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  },
  // [EcosystemId.Fantom]: { address: null },
  // [EcosystemId.Karura]: { address: null },
  // [EcosystemId.Polygon]: { address: null },
  [SOLANA_ECOSYSTEM_ID]: {
    address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    connected: true,
  },
} as Wallets;
