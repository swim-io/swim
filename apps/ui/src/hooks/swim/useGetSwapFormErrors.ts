import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { EcosystemId, ecosystems } from "../../config";
import type { Amount } from "../../models";
import { isValidSlippageFraction } from "../../models";
import { isNotNull } from "../../utils";
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
  const fromTokenBalance = fromTokenUserBalances[fromToken.nativeEcosystem];
  const isLargeSwap = useIsLargeSwap(fromToken, toToken, inputAmount);

  return (allowLargeSwap: boolean) => {
    let errors: readonly string[] = [];
    // Require connected Solana wallet
    if (!wallets.solana.connected) {
      errors = [...errors, "Connect Solana wallet"];
    }

    // Require source token to have a connected wallet
    if (
      fromToken.nativeEcosystem !== EcosystemId.Solana &&
      !wallets[fromToken.nativeEcosystem].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ecosystems[fromToken.nativeEcosystem].displayName} wallet`,
      ];
    }

    // Require destination token to have a connected wallet
    if (
      toToken.nativeEcosystem !== EcosystemId.Solana &&
      !wallets[toToken.nativeEcosystem].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ecosystems[toToken.nativeEcosystem].displayName} wallet`,
      ];
    }

    // Require non-zero native balances
    const requiredEcosystems = new Set(
      [
        EcosystemId.Solana,
        fromToken.nativeEcosystem,
        toToken.nativeEcosystem,
      ].filter(isNotNull),
    );
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${ecosystems[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
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
