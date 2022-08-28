import * as Sentry from "@sentry/react";
import type { EvmWalletAdapter } from "@swim-io/evm";
import { EVM_PROTOCOL } from "@swim-io/evm";
import type { SolanaWalletAdapter } from "@swim-io/solana";
import { SOLANA_PROTOCOL } from "@swim-io/solana";
import { truncate } from "@swim-io/utils";
import { produce } from "immer";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import { Protocol } from "../../config";
import { captureException } from "../../errors";
import { i18next } from "../../i18n";
import type { WalletAdapter, WalletServiceId } from "../../models";
import { isWalletServiceId } from "../../models";

import { useNotification as notificationStore } from "./useNotification";

export interface WalletAdapterState {
  readonly evm: EvmWalletAdapter | null;
  readonly solana: SolanaWalletAdapter | null;
  readonly connectService: ({
    protocol,
    serviceId,
    adapter,
    options,
  }: {
    readonly protocol: Protocol;
    readonly serviceId: WalletServiceId;
    readonly adapter: WalletAdapter;
    readonly options?: {
      /**
       * silentError is used when auto-connecting since we don't want to show a toast in case something goes wrong
       */
      readonly silentError?: boolean;
      /**
       * connectArgs is only used in phantom wallet
       * https://docs.phantom.app/integrating/extension-and-in-app-browser-web-apps/establishing-a-connection#eagerly-connecting
       */
      readonly connectArgs?: { readonly onlyIfTrusted: true };
    };
  }) => Promise<void>;
  readonly disconnectService: ({
    protocol,
    options,
  }: {
    readonly protocol: Protocol;
    readonly options?: { readonly silently?: boolean };
  }) => Promise<void>;
  readonly selectedServiceByProtocol: Record<Protocol, WalletServiceId | null>;
}

const isValidSelectedServiceByProtocol = (
  persistedState: unknown,
): persistedState is Pick<WalletAdapterState, "selectedServiceByProtocol"> => {
  if (typeof persistedState !== "object" || persistedState === null) {
    return false;
  }

  const selectedServiceByProtocol = (persistedState as Record<string, unknown>)
    .selectedServiceByProtocol as Record<string, string | null> | null;
  if (
    typeof selectedServiceByProtocol !== "object" ||
    selectedServiceByProtocol === null
  ) {
    return false;
  }

  return (
    Object.keys(selectedServiceByProtocol).every((key) =>
      [Protocol.Evm.toString(), Protocol.Solana.toString()].includes(key),
    ) &&
    Object.values(selectedServiceByProtocol).every(
      (value) => value === null || isWalletServiceId(value),
    )
  );
};

const getEvmWalletSentryContextKey = async (
  adapter: EvmWalletAdapter,
): Promise<string> => {
  const networkName = await adapter.getNetworkName();
  return `${networkName || "Unknown Network"} Wallet`;
};
const onEvmWalletConnected = async (
  adapter: EvmWalletAdapter,
): Promise<void> => {
  const sentryContextKey = await getEvmWalletSentryContextKey(adapter);
  Sentry.setContext(sentryContextKey, {
    walletName: adapter.serviceName,
    address: adapter.address,
  });
  Sentry.addBreadcrumb({
    category: "wallet",
    message: `Connected to ${sentryContextKey} ${String(adapter.address)}`,
    level: "info",
  });
};
const onEvmWalletDisconnected = async (
  adapter: EvmWalletAdapter,
): Promise<void> => {
  const sentryContextKey = await getEvmWalletSentryContextKey(adapter);
  Sentry.setContext(sentryContextKey, {});
  Sentry.addBreadcrumb({
    category: "wallet",
    message: `Disconnected from ${sentryContextKey}`,
    level: "info",
  });
};

const getSolanaWalletSentryContextKey = (): string => {
  return "Solana Wallet";
};
const onSolanaWalletConnected = (adapter: SolanaWalletAdapter): void => {
  if (adapter.publicKey === null) {
    return;
  }

  const sentryContextKey = getSolanaWalletSentryContextKey();
  // Identify users by their Solana wallet address
  Sentry.setUser({ id: adapter.publicKey.toBase58() });
  Sentry.setContext(sentryContextKey, {
    walletName: adapter.serviceName,
    address: adapter.publicKey.toBase58(),
  });
  Sentry.addBreadcrumb({
    category: "wallet",
    message: `Connected to ${sentryContextKey} ${adapter.publicKey.toBase58()}`,
    level: "info",
  });
};
const onSolanaWalletDisconnected = (): void => {
  const sentryContextKey = getSolanaWalletSentryContextKey();
  Sentry.configureScope((scope) => scope.setUser(null));
  Sentry.setContext(sentryContextKey, {});
  Sentry.addBreadcrumb({
    category: "wallet",
    message: `Disconnected from ${sentryContextKey}`,
    level: "info",
  });
};

export const useWalletAdapter = create(
  persist<
    WalletAdapterState,
    [], // eslint-disable-line functional/prefer-readonly-type
    [], // eslint-disable-line functional/prefer-readonly-type
    Pick<WalletAdapterState, "selectedServiceByProtocol">
  >(
    (set, get) => ({
      evm: null,
      solana: null,
      selectedServiceByProtocol: {
        [Protocol.Evm]: null,
        [Protocol.Solana]: null,
      },
      connectService: async ({
        protocol,
        serviceId,
        adapter,
        options = {},
      }) => {
        const state = get();
        const previous = protocol === Protocol.Evm ? state.evm : state.solana;

        if (previous) await state.disconnectService({ protocol });

        const disconnect = () =>
          state.disconnectService({ protocol, options: { silently: true } });
        const { notify } = notificationStore.getState();

        const handleConnect = (): void => {
          if (adapter.address) {
            notify(
              i18next.t<string>("notify.connected_to_wallet_title"),
              i18next.t<string>("notify.connected_to_wallet_description", {
                walletAddress: truncate(adapter.address),
              }),
              "info",
              7000,
            );
          }

          switch (protocol) {
            case Protocol.Evm:
              onEvmWalletConnected(adapter as EvmWalletAdapter).catch(
                console.error,
              );
              break;
            case Protocol.Solana:
              onSolanaWalletConnected(adapter as SolanaWalletAdapter);
              break;
            default:
          }
        };
        const handleDisconnect = (): void => {
          notify(
            i18next.t<string>("notify.disconnected_from_wallet_title"),
            i18next.t<string>("notify.disconnected_from_wallet_description"),
            "warning",
          );
          void disconnect();

          switch (protocol) {
            case Protocol.Evm:
              onEvmWalletDisconnected(adapter as EvmWalletAdapter).catch(
                console.error,
              );
              break;
            case Protocol.Solana:
              onSolanaWalletDisconnected();
              break;
            default:
          }
        };
        const handleError = (title: string, description: string): void => {
          notify(title, description, "error");
          void disconnect();
        };

        adapter.on("connect", handleConnect);
        adapter.on("disconnect", handleDisconnect);
        if (!options.silentError) adapter.on("error", handleError);

        try {
          await adapter.connect(options.connectArgs);

          // when silentError is true we need to wait till the adapter is connected
          // before we register the error handler
          if (options.silentError) {
            adapter.on("error", handleError);
          }

          set(
            produce<WalletAdapterState>((draft) => {
              draft.selectedServiceByProtocol[protocol] = serviceId;

              switch (adapter.protocol) {
                case EVM_PROTOCOL: {
                  draft.evm = adapter;
                  break;
                }
                case SOLANA_PROTOCOL: {
                  draft.solana = adapter;
                  break;
                }
              }
            }),
          );
        } catch (error) {
          captureException(error);
        }
      },
      disconnectService: async ({
        protocol,
        options = { silently: false },
      }) => {
        const state = get();
        const adapter = protocol === Protocol.Evm ? state.evm : state.solana;

        if (adapter) {
          if (adapter.connected && !options.silently)
            await adapter.disconnect().catch(console.error);

          adapter.removeAllListeners();

          if (adapter.connected && options.silently)
            await adapter.disconnect().catch(console.error);
        }

        set(
          produce<WalletAdapterState>((draft) => {
            draft.selectedServiceByProtocol[protocol] = null;

            switch (protocol) {
              case Protocol.Evm: {
                draft.evm = null;
                break;
              }
              case Protocol.Solana: {
                draft.solana = null;
                break;
              }
            }
          }),
        );
      },
    }),
    {
      name: "wallets-adapter",
      getStorage: (): StateStorage => localStorage,
      partialize: (state: WalletAdapterState) => ({
        selectedServiceByProtocol: state.selectedServiceByProtocol,
      }),
      merge: (
        persistedState: unknown,
        currentState: WalletAdapterState,
      ): WalletAdapterState => {
        if (isValidSelectedServiceByProtocol(persistedState)) {
          return {
            ...currentState,
            selectedServiceByProtocol: persistedState.selectedServiceByProtocol,
          };
        }

        return currentState;
      },
    },
  ),
);
