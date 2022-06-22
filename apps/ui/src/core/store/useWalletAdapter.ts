import { produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import { Protocol } from "../../config";
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
  readonly connectService: (
    protocol: Protocol,
    serviceId: WalletServiceId,
    adapter: WalletAdapter,
    connectArgs?: any,
  ) => Promise<void>;
  readonly disconnectService: (
    protocol: Protocol,
    silently?: boolean,
  ) => Promise<void>;
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
        [Protocol.Evm.toString(), Protocol.Solana.toString()].includes(key),
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
        [Protocol.Evm]: null,
        [Protocol.Solana]: null,
      },
      connectService: async (protocol, serviceId, adapter, connectArgs) => {
        const state = get();
        const previous = protocol === Protocol.Evm ? state.evm : state.solana;

        if (previous) await state.disconnectService(protocol);

        const disconnect = () => state.disconnectService(protocol, true);
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

        const listeners = {
          connect: handleConnect,
          disconnect: handleDisconnect,
          error: handleError,
        };

        Object.entries(listeners).forEach(([event, listener]) => {
          adapter.on(event, listener);
        });

        try {
          await adapter.connect(connectArgs);

          set(
            produce<WalletAdapterState>((draft) => {
              draft.selectedServiceByProtocol[protocol] = serviceId;

              switch (adapter.protocol) {
                case Protocol.Evm: {
                  draft.evm = adapter;
                  break;
                }
                case Protocol.Solana: {
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
      disconnectService: async (protocol, silently = false) => {
        const state = get();
        const adapter = protocol === Protocol.Evm ? state.evm : state.solana;

        if (adapter) {
          if (adapter.connected && !silently)
            await adapter.disconnect().catch(console.error);

          adapter.removeAllListeners();

          if (adapter.connected && silently)
            await adapter.disconnect().catch(console.error);
        }

        set(
          produce<WalletAdapterState>((draft) => {
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
