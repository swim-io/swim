import shallow from "zustand/shallow.js";

import type { Protocol } from "../../config";
import { selectWalletAdapterApi } from "../../core/selectors";
import type { WalletAdapterState } from "../../core/store";
import { useWalletAdapter } from "../../core/store";
import type { WalletService } from "../../models";
import { createAdapter } from "../../models";
import { useSolanaEcosystem } from "../crossEcosystem";

type WalletServiceApi = Pick<WalletAdapterState, "disconnectService"> & {
  readonly connectService: ({
    serviceId,
    protocol,
  }: {
    readonly serviceId: WalletService["id"];
    readonly protocol: Protocol;
  }) => Promise<void>;
};

export const useWalletService = (): WalletServiceApi => {
  const { connectService, disconnectService } = useWalletAdapter(
    selectWalletAdapterApi,
    shallow,
  );
  const solanaEcosystem = useSolanaEcosystem();
  const { endpoint } = solanaEcosystem.chain;

  return {
    connectService: ({ serviceId, protocol }) =>
      connectService({
        protocol,
        serviceId,
        adapter: createAdapter(serviceId, protocol, endpoint),
      }),
    disconnectService,
  };
};
