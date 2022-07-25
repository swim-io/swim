import { EcosystemId } from "../../config";
import type { Wallets } from "../../models";
import { useEvmWallet } from "../evm/useEvmWallet";
import { useSolanaWallet } from "../solana/useSolanaWallet";

export const useWallets = (): Wallets => ({
  [EcosystemId.Solana]: useSolanaWallet(),
  [EcosystemId.Ethereum]: useEvmWallet(),
  [EcosystemId.Bnb]: useEvmWallet(),
  [EcosystemId.Avalanche]: useEvmWallet(),
  [EcosystemId.Polygon]: useEvmWallet(),
  [EcosystemId.Aurora]: useEvmWallet(),
  [EcosystemId.Fantom]: useEvmWallet(),
  [EcosystemId.Karura]: useEvmWallet(),
  [EcosystemId.Acala]: useEvmWallet(),
});
