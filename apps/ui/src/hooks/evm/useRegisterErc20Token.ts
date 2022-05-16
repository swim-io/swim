import * as Sentry from "@sentry/react";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { ecosystems } from "../../config";
import { useEvmWallet } from "../../contexts";
import { selectNotify } from "../../core/selectors";
import { useNotificationStore } from "../../core/store";

interface RegisterErc20TokenResult {
  readonly showPrompt: (tokenSpec: TokenSpec) => Promise<void>;
}

export const useRegisterErc20Token = (
  ecosystemId: EvmEcosystemId,
): RegisterErc20TokenResult => {
  const notify = useNotificationStore(selectNotify);
  const { wallet } = useEvmWallet(ecosystemId);

  const showPrompt = async (tokenSpec: TokenSpec): Promise<void> => {
    if (!wallet) {
      notify(
        "No wallet",
        `Connect ${ecosystems[ecosystemId].displayName} wallet first`,
        "warning",
      );
      return;
    }

    try {
      await wallet.registerToken(tokenSpec);
    } catch (error) {
      notify("Error", "Failed to add token", "error");
      Sentry.captureException(error);
    }
  };

  return {
    showPrompt: showPrompt,
  };
};
