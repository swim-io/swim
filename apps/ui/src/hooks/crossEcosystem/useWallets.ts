import type { Wallets } from "../../models";
import { useEvmWallet } from "../evm/useEvmWallet";
import { useSolanaWallet } from "../solana/useSolanaWallet";

export const useWallets = (): Wallets => ({
  solana: useSolanaWallet(),
  ethereum: useEvmWallet(),
  bnb: useEvmWallet(),
  // [EcosystemId.Avalanche]: useEvmWallet(),
  // [EcosystemId.Polygon]: useEvmWallet(),
  // [EcosystemId.Aurora]: useEvmWallet(),
  // [EcosystemId.Fantom]: useEvmWallet(),
  // [EcosystemId.Karura]: useEvmWallet(),
  // [EcosystemId.Acala]: useEvmWallet(),
});
