import { useTranslation } from "react-i18next";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { ECOSYSTEMS } from "../../config";
import { useNotification } from "../../core/store";
import { captureException } from "../../errors";

import { useEvmChainId } from "./useEvmChainId";
import { useEvmWallet } from "./useEvmWallet";

interface RegisterErc20TokenResult {
  readonly showPrompt: (tokenSpec: TokenSpec) => Promise<void>;
}

export const useRegisterErc20Token = (
  ecosystemId: EvmEcosystemId,
): RegisterErc20TokenResult => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { wallet } = useEvmWallet();
  const evmChainId = useEvmChainId(ecosystemId);

  const showPrompt = async (tokenSpec: TokenSpec): Promise<void> => {
    if (!wallet) {
      notify(
        // t("notify.register_token_without_wallet_title"),
        "No wallet",
        // t("notify.register_token_without_wallet_description", {
        //   ecosystemName: ECOSYSTEMS[ecosystemId].displayName,
        // }),
        `Connect ${ECOSYSTEMS[ecosystemId].displayName} wallet first`,
        "warning",
      );
      return;
    }

    try {
      await wallet.registerToken(tokenSpec, ecosystemId, evmChainId);
    } catch (error) {
      notify(
        // t("notify.register_token_failed_title"),
        "Error",
        // t("notify.register_token_failed_description"),
        "Failed to add token",
        "error",
      );
      captureException(error);
    }
  };

  return {
    showPrompt: showPrompt,
  };
};
