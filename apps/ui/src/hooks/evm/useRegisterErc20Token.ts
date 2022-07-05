import * as Sentry from "@sentry/react";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { ECOSYSTEMS } from "../../config";
import { useNotification } from "../../core/store";

import { useEvmChainId } from "./useEvmChainId";
import { useEvmWallet } from "./useEvmWallet";

interface RegisterErc20TokenResult {
  readonly showPrompt: (tokenSpec: TokenSpec) => Promise<void>;
}

export const useRegisterErc20Token = (
  ecosystemId: EvmEcosystemId,
): RegisterErc20TokenResult => {
  const { notify } = useNotification();
  const { wallet } = useEvmWallet();
  const evmChainId = useEvmChainId(ecosystemId);

  const showPrompt = async (tokenSpec: TokenSpec): Promise<void> => {
    if (!wallet) {
      notify(
        "No wallet",
        `Connect ${ECOSYSTEMS[ecosystemId].displayName} wallet first`,
        "warning",
      );
      return;
    }

    try {
      await wallet.registerToken(tokenSpec, ecosystemId, evmChainId);
    } catch (error) {
      notify("Error", "Failed to add token", "error");
      Sentry.captureException(error);
    }
  };

  return {
    showPrompt: showPrompt,
  };
};
