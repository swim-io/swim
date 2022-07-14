import { produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type { Protocol } from "../../config";
import { captureException } from "../../errors";
import type {
  EvmWalletAdapter,
  SolanaWalletAdapter,
  WalletAdapter,
  WalletServiceId,
} from "../../models";
import { isWalletServiceId } from "../../models";
import { shortenAddress } from "../../utils";

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
  return (
    persistedState != null &&
    typeof persistedState === "object" &&
    typeof (persistedState as any).selectedServiceByProtocol === "object" &&
    Object.keys((persistedState as any).selectedServiceByProtocol || {}).every(
      (key) =>
        [EVM_PROTOCOL.toString(), SOLANA_PROTOCOL.toString()].includes(key),
    ) &&
    Object.values((persistedState as any).selectedServiceByProtocol).every(
      (value) => value === null || isWalletServiceId(value),
    )
  );
};

export const useWalletAdapter = create(
  persist<WalletAdapterState>(
    (set: SetState<WalletAdapterState>, get: GetState<WalletAdapterState>) => ({
      evm: null,
      solana: null,
      selectedServiceByProtocol: {
        [EVM_PROTOCOL]: null,
        [SOLANA_PROTOCOL]: null,
      },
      connectService: async ({
        protocol,
        serviceId,
        adapter,
        options = {},
      }) => {
        const state = get();
        const previous = protocol === EVM_PROTOCOL ? state.evm : state.solana;

        if (previous) await state.disconnectService({ protocol });

        const disconnect = () =>
          state.disconnectService({ protocol, options: { silently: true } });
        const { notify } = notificationStore.getState();

        const handleConnect = (): void => {
          if (adapter.address) {
            notify(
              "Wallet update",
              `Connected to wallet ${shortenAddress(adapter.address)}`,
              "info",
              7000,
            );
          }
        };
        const handleDisconnect = (): void => {
          notify("Wallet update", "Disconnected from wallet", "warning");
          void disconnect();
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
        const adapter = protocol === EVM_PROTOCOL ? state.evm : state.solana;

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
              case EVM_PROTOCOL: {
                draft.evm = null;
                break;
              }
              case SOLANA_PROTOCOL: {
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
