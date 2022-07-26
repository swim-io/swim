import { getRecordEntries } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import type { BaseWallet } from "../swim";
import type { EvmWalletAdapter, SolanaWalletAdapter } from "../wallets";

export interface SolanaWalletInterface {
  readonly wallet: SolanaWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export interface EvmWalletInterface {
  readonly wallet: EvmWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export interface Wallets extends ReadonlyRecord<EcosystemId, BaseWallet> {
  readonly [EcosystemId.Solana]: SolanaWalletInterface;
  readonly [EcosystemId.Ethereum]: EvmWalletInterface;
  readonly [EcosystemId.Bnb]: EvmWalletInterface;
  readonly [EcosystemId.Avalanche]: EvmWalletInterface;
  readonly [EcosystemId.Polygon]: EvmWalletInterface;
  readonly [EcosystemId.Aurora]: EvmWalletInterface;
  readonly [EcosystemId.Fantom]: EvmWalletInterface;
  readonly [EcosystemId.Karura]: EvmWalletInterface;
  readonly [EcosystemId.Acala]: EvmWalletInterface;
}

export const getAddressesByEcosystem = (
  wallets: Wallets,
): ReadonlyRecord<EcosystemId, string | null> =>
  getRecordEntries(wallets).reduce<ReadonlyRecord<string, string | null>>(
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
      (isEcosystemEnabled(ecosystemId as EcosystemId) &&
        address === wallets[ecosystemId as EcosystemId].address),
  );
};
