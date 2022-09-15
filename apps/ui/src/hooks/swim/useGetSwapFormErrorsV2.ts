import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { isNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";

import { ECOSYSTEMS } from "../../config";
import type { TokenOption } from "../../models";
import { isValidSlippageFraction } from "../../models";
import {
  useUserBalanceAmount,
  useUserNativeBalances,
  useWallets,
} from "../crossEcosystem";

export const useGetSwapFormErrorsV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
  inputAmount: Decimal,
  maxSlippageFraction: Decimal | null,
) => {
  const wallets = useWallets();
  const userNativeBalances = useUserNativeBalances();
  const fromToken = fromTokenOption.tokenConfig;
  const fromTokenBalance = useUserBalanceAmount(
    fromToken,
    fromTokenOption.ecosystemId,
  );

  return () => {
    let errors: readonly string[] = [];

    const requiredEcosystems = new Set(
      [fromTokenOption.ecosystemId, toTokenOption.ecosystemId].filter(
        isNotNull,
      ),
    );

    requiredEcosystems.forEach((ecosystem) => {
      // Require connected wallet
      if (!wallets[fromTokenOption.ecosystemId].connected) {
        errors = [
          ...errors,
          `Connect ${
            ECOSYSTEMS[fromTokenOption.ecosystemId].displayName
          } wallet`,
        ];
      }
      // Require non-zero native balances
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${ECOSYSTEMS[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
        ];
      }
    });

    // Require enough user balances
    if (
      fromTokenBalance &&
      inputAmount.gt(fromTokenBalance.toHuman(fromTokenOption.ecosystemId))
    ) {
      errors = [
        ...errors,
        `Insufficient funds for ${
          ECOSYSTEMS[fromTokenOption.ecosystemId].displayName
        } ${TOKEN_PROJECTS_BY_ID[fromToken.projectId].displayName}`,
      ];
    }

    if (inputAmount.isZero()) {
      errors = [...errors, "Provide a valid amount"];
    }

    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, "Provide a valid max slippage setting"];
    }

    return errors;
  };
};
