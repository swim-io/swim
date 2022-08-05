import { isNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { ECOSYSTEMS, EcosystemId } from "../../config";
import type { Amount } from "../../models";
import { isValidSlippageFraction } from "../../models";
import {
  useUserBalanceAmounts,
  useUserNativeBalances,
  useWallets,
} from "../crossEcosystem";

import { useIsLargeSwap } from "./useIsLargeSwap";

export const useGetSwapFormErrors = (
  fromToken: TokenSpec,
  toToken: TokenSpec,
  inputAmount: Amount,
  maxSlippageFraction: Decimal | null,
) => {
  const wallets = useWallets();
  const userNativeBalances = useUserNativeBalances();
  const fromTokenUserBalances = useUserBalanceAmounts(fromToken);
  const fromTokenBalance = fromTokenUserBalances[fromToken.nativeEcosystemId];
  const isLargeSwap = useIsLargeSwap(fromToken, toToken, inputAmount);

  return (allowLargeSwap: boolean) => {
    let errors: readonly string[] = [];
    // Require connected Solana wallet
    if (!wallets.solana.connected) {
      errors = [...errors, "Connect Solana wallet"];
    }

    // Require source token to have a connected wallet
    if (
      fromToken.nativeEcosystemId !== EcosystemId.Solana &&
      !wallets[fromToken.nativeEcosystemId].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ECOSYSTEMS[fromToken.nativeEcosystemId].displayName} wallet`,
      ];
    }

    // Require destination token to have a connected wallet
    if (
      toToken.nativeEcosystemId !== EcosystemId.Solana &&
      !wallets[toToken.nativeEcosystemId].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ECOSYSTEMS[toToken.nativeEcosystemId].displayName} wallet`,
      ];
    }

    // Require non-zero native balances
    const requiredEcosystems = new Set(
      [
        EcosystemId.Solana,
        fromToken.nativeEcosystemId,
        toToken.nativeEcosystemId,
      ].filter(isNotNull),
    );
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${ECOSYSTEMS[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
        ];
      }
    });

    // Need some SOL for network fee
    if (
      userNativeBalances[EcosystemId.Solana].greaterThan(0) &&
      userNativeBalances[EcosystemId.Solana].lessThan(0.01)
    ) {
      errors = [
        ...errors,
        `Low SOL in Solana wallet. You will need up to ~0.01 SOL to pay for network fees.`,
      ];
    }

    // Require enough user balances
    if (fromTokenBalance && inputAmount.gt(fromTokenBalance)) {
      errors = [...errors, "Insufficient funds"];
    }

    if (inputAmount.isZero()) {
      errors = [...errors, "Provide a valid amount"];
    }

    if (isLargeSwap && !allowLargeSwap) {
      // If not allowed, limit swap size to 10% of pool supply
      errors = [...errors, "Swap size must be less than 10% of pool supply"];
    }

    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, "Provide a valid max slippage setting"];
    }

    return errors;
  };
};
