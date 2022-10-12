import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";
import { useTranslation } from "react-i18next";

import type { TokenConfig } from "../../config";
import { ECOSYSTEMS } from "../../config";
import type { Amount } from "../../models";
import { isValidSlippageFraction } from "../../models";
import {
  useUserBalanceAmount,
  useUserNativeBalances,
  useWallets,
} from "../crossEcosystem";

import { useIsLargeSwap } from "./useIsLargeSwap";

export const useGetSwapFormErrors = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  inputAmount: Amount,
  maxSlippageFraction: Decimal | null,
) => {
  const { t } = useTranslation();
  const wallets = useWallets();
  const fromTokenBalance = useUserBalanceAmount(
    fromToken,
    fromToken.nativeEcosystemId,
  );
  const isLargeSwap = useIsLargeSwap(fromToken, toToken, inputAmount);

  const requiredEcosystems = new Set(
    [
      SOLANA_ECOSYSTEM_ID,
      fromToken.nativeEcosystemId,
      toToken.nativeEcosystemId,
    ].filter(isNotNull),
  );
  const userNativeBalances = useUserNativeBalances(
    Array.from(requiredEcosystems),
  );

  return (allowLargeSwap: boolean) => {
    let errors: readonly string[] = [];

    requiredEcosystems.forEach((ecosystemId) => {
      errors = [
        ...errors,
        t("general.ecosystem.disabled", { ecosystemName: ecosystemId }),
      ];
    });

    // Require connected Solana wallet
    if (!wallets.solana.connected) {
      errors = [
        ...errors,
        t("general.connect_specific_wallet", { ecosystemName: "Solana" }),
      ];
    }

    // Require source token to have a connected wallet
    if (
      fromToken.nativeEcosystemId !== SOLANA_ECOSYSTEM_ID &&
      !wallets[fromToken.nativeEcosystemId].connected
    ) {
      errors = [
        ...errors,
        t("general.connect_specific_wallet", {
          ecosystemName: ECOSYSTEMS[fromToken.nativeEcosystemId].displayName,
        }),
      ];
    }

    // Require destination token to have a connected wallet
    if (
      toToken.nativeEcosystemId !== SOLANA_ECOSYSTEM_ID &&
      !wallets[toToken.nativeEcosystemId].connected
    ) {
      errors = [
        ...errors,
        t("general.connect_specific_wallet", {
          ecosystemName: ECOSYSTEMS[toToken.nativeEcosystemId].displayName,
        }),
      ];
    }

    // Require non-zero native balances
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          t("general.require_non_empty_balance_in_specific_wallet", {
            ecosystemName: ECOSYSTEMS[ecosystem].displayName,
          }),
        ];
      }
    });

    // Need some SOL for network fee
    if (
      userNativeBalances[SOLANA_ECOSYSTEM_ID].greaterThan(0) &&
      userNativeBalances[SOLANA_ECOSYSTEM_ID].lessThan(0.01)
    ) {
      errors = [
        ...errors,
        t("general.require_some_balance_in_solana_wallet", {
          minimumFee: 0.01,
        }),
      ];
    }

    // Require enough user balances
    if (fromTokenBalance && inputAmount.gt(fromTokenBalance)) {
      errors = [...errors, t("swap_form.require_sufficient_funds")];
    }

    if (inputAmount.isZero()) {
      errors = [...errors, t("swap_form.require_valid_amount")];
    }

    if (isLargeSwap && !allowLargeSwap) {
      // If not allowed, limit swap size to 10% of pool supply
      errors = [
        ...errors,
        t("swap_form.require_swap_size_must_be_less_than_x_of_pool_supply", {
          percentage: 10,
        }),
      ];
    }

    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, t("general.require_a_valid_max_slippage_setting")];
    }

    return errors;
  };
};
