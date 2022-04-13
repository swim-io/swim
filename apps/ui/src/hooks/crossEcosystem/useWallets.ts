import { EcosystemId } from "../../config";
import type {
  EvmWalletContextInterface,
  SolanaWalletContextInterface,
} from "../../contexts";
import { useEvmWallet, useSolanaWallet } from "../../contexts";
import type { BaseWallet } from "../../models";
import type { ReadonlyRecord } from "../../utils";

export interface Wallets extends ReadonlyRecord<EcosystemId, BaseWallet> {
  readonly [EcosystemId.Solana]: SolanaWalletContextInterface;
  readonly [EcosystemId.Ethereum]: EvmWalletContextInterface;
  readonly [EcosystemId.Terra]: {
    readonly address: null;
    readonly connected: false;
  };
  readonly [EcosystemId.Bsc]: EvmWalletContextInterface;
  readonly [EcosystemId.Avalanche]: EvmWalletContextInterface;
  readonly [EcosystemId.Polygon]: EvmWalletContextInterface;
}

export const useWallets = (): Wallets => ({
  [EcosystemId.Solana]: useSolanaWallet(),
  [EcosystemId.Ethereum]: useEvmWallet(EcosystemId.Ethereum),
  [EcosystemId.Terra]: { address: null, connected: false },
  [EcosystemId.Bsc]: useEvmWallet(EcosystemId.Bsc),
  [EcosystemId.Avalanche]: useEvmWallet(EcosystemId.Avalanche),
  [EcosystemId.Polygon]: useEvmWallet(EcosystemId.Polygon),
});

export const getAddressesByEcosystem = (
  wallets: Wallets,
): ReadonlyRecord<EcosystemId, string | null> =>
  Object.entries(wallets).reduce<ReadonlyRecord<string, string | null>>(
    (accumulator, [ecosystemId, { address }]) => ({
      ...accumulator,
      [ecosystemId]: address,
    }),
    {},
  );

export const getAddressesForEcosystems = (
  ecosystems: readonly EcosystemId[],
  wallets: Wallets,
): ReadonlyRecord<EcosystemId, string | null> =>
  ecosystems.reduce<ReadonlyRecord<string, string | null>>(
    (accumulator, ecosystemId) => ({
      ...accumulator,
      [ecosystemId]: wallets[ecosystemId].address,
    }),
    {},
  );

export const isEveryAddressConnected = (
  addresses: ReadonlyRecord<EcosystemId, string | null>,
  wallets: Wallets,
): boolean => {
  return Object.entries(addresses).every(
    ([ecosystemId, address]) =>
      address === null ||
      address === wallets[ecosystemId as EcosystemId].address,
  );
};
