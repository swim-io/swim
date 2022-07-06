import { EcosystemId } from "../../config";
import { useEvmWallet } from "../evm/useEvmWallet";
import { useSolanaWallet } from "../solana/useSolanaWallet";

import { Wallets } from "../utils"

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
