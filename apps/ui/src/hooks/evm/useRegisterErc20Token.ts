import type { EvmEcosystemId } from "@swim-io/evm";
import { useTranslation } from "react-i18next";

import type { TokenConfig } from "../../config";
import { ECOSYSTEMS, getTokenDetailsForEcosystem } from "../../config";
import { useNotification } from "../../core/store";
import { captureException } from "../../errors";

import { useEvmChainId } from "./useEvmChainId";
import { useEvmWallet } from "./useEvmWallet";

interface RegisterErc20TokenResult {
  readonly showPrompt: (tokenConfig: TokenConfig) => Promise<void>;
}

export const useRegisterErc20Token = (
  ecosystemId: EvmEcosystemId,
): RegisterErc20TokenResult => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { wallet } = useEvmWallet();
  const evmChainId = useEvmChainId(ecosystemId);

  const showPrompt = async (tokenConfig: TokenConfig): Promise<void> => {
    if (!wallet) {
      notify(
        t("notify.register_token_without_wallet_title"),
        t("notify.register_token_without_wallet_description", {
          ecosystemName: ECOSYSTEMS[ecosystemId].displayName,
        }),
        "warning",
      );
      return;
    }

    try {
      const tokenDetails = getTokenDetailsForEcosystem(
        tokenConfig,
        ecosystemId,
      );
      if (!tokenDetails) {
        throw new Error(`No "${ecosystemId}" details for token`);
      }
      await wallet.registerToken(
        tokenDetails,
        tokenConfig.projectId,
        evmChainId,
      );
    } catch (error) {
      notify(
        t("notify.register_token_failed_title"),
        t("notify.register_token_failed_description"),
        "error",
      );
      captureException(error);
    }
  };

  return {
    showPrompt: showPrompt,
  };
};
