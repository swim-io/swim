import type { EcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import type { BaseWallet } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import type { EvmWalletInterface } from "../evm";
import type { SolanaWalletInterface } from "../solana";

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
      (isEcosystemEnabled(ecosystemId as EcosystemId) &&
        address === wallets[ecosystemId as EcosystemId].address),
  );
};
