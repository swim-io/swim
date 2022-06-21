import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig, selectWalletAdapterApi } from "../../core/selectors";
import type { WalletAdapterState } from "../../core/store";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import type { WalletService } from "../../models";
import { createAdapter } from "../../models";

type WalletServiceApi = Pick<WalletAdapterState, "disconnectService"> & {
  readonly connectService: (
    serviceId: WalletService["id"],
    protocol: Protocol,
  ) => Promise<void>;
  readonly solanaEndpoint: string;
};

export const useWalletService = (): WalletServiceApi => {
  const { connectService, disconnectService } = useWalletAdapter(
    selectWalletAdapterApi,
    shallow,
  );
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoint }] = chains[Protocol.Solana];

  return {
    solanaEndpoint: endpoint,
    connectService: (serviceId: WalletService["id"], protocol: Protocol) =>
      connectService(
        protocol,
        serviceId,
        createAdapter(serviceId, protocol, endpoint),
      ),
    disconnectService,
  };
};
