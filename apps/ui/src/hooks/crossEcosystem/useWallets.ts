import type { EcosystemId } from "../../config";
import type { Wallets } from "../../models";
import { useEvmWallet } from "../evm/useEvmWallet";
import { useSolanaWallet } from "../solana/useSolanaWallet";

export const useWallets = (): Wallets => ({
  [SOLANA_ECOSYSTEM_ID]: useSolanaWallet(),
  [ETHEREUM_ECOSYSTEM_ID]: useEvmWallet(),
  [BNB_ECOSYSTEM_ID]: useEvmWallet(),
  [EcosystemId.Avalanche]: useEvmWallet(),
  [EcosystemId.Polygon]: useEvmWallet(),
  [EcosystemId.Aurora]: useEvmWallet(),
  [EcosystemId.Fantom]: useEvmWallet(),
  [EcosystemId.Karura]: useEvmWallet(),
  [EcosystemId.Acala]: useEvmWallet(),
});
