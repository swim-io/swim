/* eslint-disable functional/immutable-data */
import { produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";

import { Protocol } from "../../config";
import type { WalletService } from "../../models";
import { findServiceForProtocol } from "../../models";
import type {
  EvmWalletAdapter,
  SolanaWalletAdapter,
  WalletAdapter,
} from "../../models/wallets/adapters";
import { SolanaDefaultWalletAdapter } from "../../models/wallets/adapters/solana/SolanaDefaultWalletAdapter";
import type { ReadonlyRecord } from "../../utils";
import { shortenAddress } from "../../utils";
import { selectConfig } from "../selectors/environment";

import { useEnvironment as environmentStore } from "./useEnvironment";
import { useNotification as notificationStore } from "./useNotification";

type WalletAdapterListeners = {
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly error: (title: string, description: string) => void;
};

export interface WalletServiceState {
  readonly evm: ReadonlyRecord<string, EvmWalletAdapter | undefined>;
  readonly evmListeners: ReadonlyRecord<
    string,
    WalletAdapterListeners | undefined
  >;
  readonly solana: ReadonlyRecord<string, SolanaWalletAdapter | undefined>;
  readonly solanaListeners: ReadonlyRecord<
    string,
    WalletAdapterListeners | undefined
  >;
  readonly connectService: (
    serviceId: string,
    protocol: Protocol,
  ) => Promise<void>;
  readonly disconnectService: (
    serviceId: string,
    protocol: Protocol,
  ) => Promise<void>;
}

export const useWalletService = create<WalletServiceState>(
  (set: SetState<WalletServiceState>, get: GetState<WalletServiceState>) => ({
    evm: {},
    evmListeners: {},
    solana: {},
    solanaListeners: {},
    connectService: async (serviceId: string, protocol: Protocol) => {
      const state = get();
      const service = findServiceForProtocol(serviceId, protocol);

      const protocolAdapters =
        protocol === Protocol.Evm ? state.evm : state.solana;
      const previous = protocolAdapters[serviceId];

      if (previous) {
        if (previous.connected) {
          const listeners =
            protocol === Protocol.Evm
              ? state.evmListeners
              : state.solanaListeners;

          // call on connect handler for successful connection toast
          listeners[serviceId]?.connect();
          return;
        }

        await state.disconnectService(serviceId, protocol);
      }

      const adapter = createAdapter(service, protocol);

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
      };
      const handleError = (title: string, description: string): void => {
        notify(title, description, "error");
      };

      const listeners: WalletAdapterListeners = {
        connect: handleConnect,
        disconnect: handleDisconnect,
        error: handleError,
      };

      Object.entries(listeners).forEach(([eventName, handler]) => {
        adapter.on(eventName, handler);
      });

      set(
        produce<WalletServiceState>((draft) => {
          switch (adapter.protocol) {
            case Protocol.Evm: {
              draft.evm[serviceId] = adapter;
              draft.evmListeners[serviceId] = listeners;
              break;
            }
            case Protocol.Solana: {
              draft.solana[serviceId] = adapter;
              draft.solanaListeners[serviceId] = listeners;
              break;
            }
          }
        }),
      );

      await adapter.connect().catch(console.error);
    },
    disconnectService: async (serviceId: string, protocol: Protocol) => {
      const state = get();
      const protocolAdapters =
        protocol === Protocol.Evm ? state.evm : state.solana;
      const adapter = protocolAdapters[serviceId];

      if (adapter) {
        await adapter.disconnect().catch(console.error);

        const protocolListeners =
          protocol === Protocol.Evm
            ? state.evmListeners
            : state.solanaListeners;

        const listeners = protocolListeners[serviceId];

        if (listeners) {
          Object.entries(listeners).forEach(([eventName, handler]) => {
            adapter.off(eventName, handler);
          });
        }
      }

      set(
        produce<WalletServiceState>((draft) => {
          switch (protocol) {
            case Protocol.Evm: {
              draft.evm[serviceId] = undefined;
              break;
            }
            case Protocol.Solana: {
              draft.solana[serviceId] = undefined;
              break;
            }
            case Protocol.Cosmos: {
              throw new Error(`Cosmos disconnect not implemented`);
            }
          }
        }),
      );
    },
  }),
);

const createAdapter = (
  service: WalletService,
  protocol: Protocol,
): WalletAdapter => {
  switch (protocol) {
    case Protocol.Evm: {
      if (!service.adapter)
        throw new Error(`Adapter is required for protocol ${protocol}`);
      return new service.adapter();
    }
    case Protocol.Solana: {
      if (service.adapter) {
        return new service.adapter();
      } else {
        const environmentStoreState = environmentStore.getState();
        const { chains } = selectConfig(environmentStoreState);
        const [{ endpoint }] = chains[Protocol.Solana];
        return new SolanaDefaultWalletAdapter(service.info.url, endpoint);
      }
    }
    case Protocol.Cosmos: {
      throw new Error(`Cosmos adapters not implemented yet`);
    }
  }
};
