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
    readonly service: null;
    readonly wallet: null;
    readonly setServiceId: null;
  };
  readonly [EcosystemId.Bsc]: EvmWalletContextInterface;
  readonly [EcosystemId.Avalanche]: EvmWalletContextInterface;
  readonly [EcosystemId.Polygon]: EvmWalletContextInterface;
  readonly [EcosystemId.Aurora]: EvmWalletContextInterface;
  readonly [EcosystemId.Fantom]: EvmWalletContextInterface;
  readonly [EcosystemId.Karura]: EvmWalletContextInterface;
  readonly [EcosystemId.Acala]: EvmWalletContextInterface;
}

export const useWallets = (): Wallets => ({
  [EcosystemId.Solana]: useSolanaWallet(),
  [EcosystemId.Ethereum]: useEvmWallet(EcosystemId.Ethereum),
  [EcosystemId.Terra]: {
    address: null,
    connected: false,
    service: null,
    setServiceId: null,
    wallet: null,
  },
  [EcosystemId.Bsc]: useEvmWallet(EcosystemId.Bsc),
  [EcosystemId.Avalanche]: useEvmWallet(EcosystemId.Avalanche),
  [EcosystemId.Polygon]: useEvmWallet(EcosystemId.Polygon),
  [EcosystemId.Aurora]: useEvmWallet(EcosystemId.Aurora),
  [EcosystemId.Fantom]: useEvmWallet(EcosystemId.Fantom),
  [EcosystemId.Karura]: useEvmWallet(EcosystemId.Karura),
  [EcosystemId.Acala]: useEvmWallet(EcosystemId.Acala),
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
