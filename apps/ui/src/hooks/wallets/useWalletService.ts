import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import shallow from "zustand/shallow.js";

import type { Protocol } from "../../config";
import { selectConfig, selectWalletAdapterApi } from "../../core/selectors";
import type { WalletAdapterState } from "../../core/store";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import type { WalletService } from "../../models";
import { createAdapter } from "../../models";
import { findOrThrow } from "../../utils";

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
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const { endpoint } = findOrThrow(
    ecosystems[SOLANA_ECOSYSTEM_ID].chains,
    (chain) => chain.env === env,
  );

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
