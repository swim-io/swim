import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { getSolanaEndpoints } from "../../contexts";
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
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [solanaEndpoint] = getSolanaEndpoints(
    env,
    chains[Protocol.Solana][0].publicRpcUrls,
  );

  return {
    connectService: ({ serviceId, protocol }) =>
      connectService({
        protocol,
        serviceId,
        adapter: createAdapter(serviceId, protocol, solanaEndpoint),
      }),
    disconnectService,
  };
};
