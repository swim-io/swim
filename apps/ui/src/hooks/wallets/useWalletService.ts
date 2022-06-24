import shallow from "zustand/shallow";

import { Protocol } from "../../config";
import { selectConfig, selectWalletAdapterApi } from "../../core/selectors";
import type { WalletAdapterState } from "../../core/store";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import type { WalletService } from "../../models";
import { createAdapter } from "../../models";

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
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoint }] = chains[Protocol.Solana];

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
