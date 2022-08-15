import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { Wallets } from "../../models";
import { useEvmWallet } from "../evm/useEvmWallet";
import { useSolanaWallet } from "../solana/useSolanaWallet";

export const useWallets = (): Wallets => ({
  [SOLANA_ECOSYSTEM_ID]: useSolanaWallet(),
  [EvmEcosystemId.Ethereum]: useEvmWallet(),
  [EvmEcosystemId.Bnb]: useEvmWallet(),
  [EvmEcosystemId.Avalanche]: useEvmWallet(),
  [EvmEcosystemId.Polygon]: useEvmWallet(),
  [EvmEcosystemId.Aurora]: useEvmWallet(),
  [EvmEcosystemId.Fantom]: useEvmWallet(),
  [EvmEcosystemId.Karura]: useEvmWallet(),
  [EvmEcosystemId.Acala]: useEvmWallet(),
});
