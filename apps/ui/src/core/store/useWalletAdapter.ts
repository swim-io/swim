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
import { selectConfig } from "../selectors/environment";

import { useEnvironment as environmentStore } from "./useEnvironment";

export interface WalletAdapterState {
  readonly evm: EvmWalletAdapter | null;
  readonly solana: SolanaWalletAdapter | null;
  readonly connectService: (
    serviceId: string,
    protocol: Protocol,
  ) => Promise<void>;
  readonly disconnectService: (protocol: Protocol) => Promise<void>;
}

export const useWalletAdapter = create<WalletAdapterState>(
  (set: SetState<WalletAdapterState>, get: GetState<WalletAdapterState>) => ({
    evm: null,
    solana: null,
    connectService: async (serviceId: string, protocol: Protocol) => {
      const service = findServiceForProtocol(serviceId, protocol);
      const adapter = createAdapter(service, protocol);

      set(
        produce<WalletAdapterState>((draft) => {
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

      await adapter.connect().catch(console.error);
    },
    disconnectService: async (protocol: Protocol) => {
      const state = get();
      const adapter = protocol === Protocol.Evm ? state.evm : state.solana;

      if (!adapter)
        throw new Error(
          `disconnectService called but no adapter found for protocol ${protocol}`,
        );

      await adapter.disconnect().catch(console.error);

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
