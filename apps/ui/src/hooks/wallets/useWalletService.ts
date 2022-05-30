import { useCallback, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import type { WalletAdapterState } from "../../core/store";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import type { WalletService } from "../../models";
import { createAdapter } from "../../models/wallets/services";

type WalletServiceState = Pick<WalletAdapterState, "disconnectService"> & {
  readonly connectService: (
    serviceId: WalletService["id"],
    protocol: Protocol,
  ) => Promise<void>;
};

export const useWalletService = (): WalletServiceState => {
  const { connectService, disconnectService } = useWalletAdapter();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoint }] = chains[Protocol.Solana];

  const createAdapterMemoized = useCallback(
    (serviceId: WalletService["id"], protocol: Protocol) => {
      return createAdapter(serviceId, protocol, endpoint);
    },
    [endpoint],
  );

  return useMemo(
    () => ({
      connectService: (serviceId: WalletService["id"], protocol: Protocol) =>
        connectService(serviceId, protocol, createAdapterMemoized),
      disconnectService,
    }),
    [connectService, disconnectService, createAdapterMemoized],
  );
};
