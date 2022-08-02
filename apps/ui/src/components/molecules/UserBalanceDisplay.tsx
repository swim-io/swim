import { EuiLink, EuiText } from "@elastic/eui";
import type React from "react";

import type { EcosystemId, TokenSpec } from "../../config";
import { useUserBalanceAmount } from "../../hooks";
import type { Amount } from "../../models";

interface Props {
  readonly token: TokenSpec;
  readonly ecosystemId: EcosystemId;
  readonly onClick?: (balance: Amount) => void;
}
export const UserBalanceDisplay: React.FC<Props> = ({
  token,
  ecosystemId,
  onClick,
}) => {
  const tokenBalance = useUserBalanceAmount(token, token.nativeEcosystemId);

  return (
    <EuiText size="xs">
      <span>Balance:</span>{" "}
      <span>
        {tokenBalance === null ? (
          "-"
        ) : onClick === undefined ? (
          <span>{tokenBalance.toFormattedHumanString(ecosystemId)}</span>
        ) : (
          <EuiLink onClick={() => onClick(tokenBalance)}>
            {tokenBalance.toFormattedHumanString(ecosystemId)}
          </EuiLink>
        )}
      </span>
    </EuiText>
  );
};
