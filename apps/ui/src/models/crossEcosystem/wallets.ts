import type { APTOS_ECOSYSTEM_ID, AptosWalletAdapter } from "@swim-io/aptos";
import type { EvmEcosystemId, EvmWalletAdapter } from "@swim-io/evm";
import type { SOLANA_ECOSYSTEM_ID, SolanaWalletAdapter } from "@swim-io/solana";
import { getRecordEntries } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import type { BaseWallet } from "../swim";

export interface AptosWalletInterface extends BaseWallet {
  readonly wallet: AptosWalletAdapter | null;
}

export interface SolanaWalletInterface extends BaseWallet {
  readonly wallet: SolanaWalletAdapter | null;
}

export interface EvmWalletInterface extends BaseWallet {
  readonly wallet: EvmWalletAdapter | null;
}

export type Wallets = {
  readonly [SOLANA_ECOSYSTEM_ID]: SolanaWalletInterface;
} & {
  readonly [APTOS_ECOSYSTEM_ID]: AptosWalletInterface;
} & ReadonlyRecord<EvmEcosystemId, EvmWalletInterface>;

export const getAddressesByEcosystem = (
  wallets: Wallets,
): ReadonlyRecord<EcosystemId, string | null> =>
  getRecordEntries<
    EcosystemId,
    SolanaWalletInterface | EvmWalletInterface | AptosWalletInterface
  >(wallets).reduce<ReadonlyRecord<string, string | null>>(
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
