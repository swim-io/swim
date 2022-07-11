import { EcosystemId } from "../../config";
import type { Wallets } from "../../models";

export const MOCK_WALLETS = {
  [EcosystemId.Acala]: { address: null },
  [EcosystemId.Aurora]: { address: null },
  [EcosystemId.Avalanche]: { address: null },
  [EcosystemId.Bnb]: { address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1" },
  [EcosystemId.Ethereum]: {
    address: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  },
  [EcosystemId.Fantom]: { address: null },
  [EcosystemId.Karura]: { address: null },
  [EcosystemId.Polygon]: { address: null },
  [EcosystemId.Solana]: {
    address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    connected: true,
  },
} as Wallets;
