import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import type { EcosystemId, TokenProject, TokenSpec } from "../config";
import { useEcosystem } from "../hooks";
import type { Amount } from "../models/amount";

export interface TokenIconProps
  extends Pick<TokenProject, "icon" | "symbol" | "displayName"> {
  readonly ecosystemId?: EcosystemId;
  readonly showFullName?: boolean;
}

export const TokenIcon = ({
  icon,
  symbol,
  displayName,
  ecosystemId,
  showFullName = false,
}: TokenIconProps): ReactElement => {
  const ecosystem = useEcosystem(ecosystemId ?? null);
  return (
    <span>
      <EuiIcon type={icon} size="l" title={symbol} />
      &nbsp;<span>{showFullName ? displayName : symbol}</span>
      {ecosystem && (
        <span>
          {" "}
          <span>on</span>{" "}
          <span style={{ whiteSpace: "nowrap" }}>
            <EuiIcon
              // TODO: Logo
              type={"ecosystem.logo"}
              size="m"
              title={ecosystem.displayName}
            />
            &nbsp;{ecosystem.displayName}
          </span>
        </span>
      )}
    </span>
  );
};

export interface AmountWithTokenIconProps {
  readonly amount: Amount;
  readonly ecosystem: EcosystemId;
}

export const AmountWithTokenIcon = ({
  amount,
  ecosystem,
}: AmountWithTokenIconProps): ReactElement => {
  return (
    <span>
      {amount.toFormattedHumanString(ecosystem)}{" "}
      <TokenSpecIcon token={amount.tokenSpec} />
    </span>
  );
};

export interface AmountsWithTokenIconsProps {
  readonly amounts: readonly Amount[];
}

export const AmountsWithTokenIcons = ({
  amounts,
}: AmountsWithTokenIconsProps): ReactElement => (
  <>
    {amounts.map((amount, i) => (
      <Fragment key={amount.tokenId}>
        {amounts.length > 1 && i === amounts.length - 1 && <span> and </span>}
        <AmountWithTokenIcon
          amount={amount}
          ecosystem={amount.tokenSpec.nativeEcosystem}
        />
        <span>{i === amounts.length - 1 ? "." : ", "}</span>
      </Fragment>
    ))}
  </>
);

export type TokenSpecIconProps = { readonly token: TokenSpec };

export const TokenSpecIcon = ({ token }: TokenSpecIconProps): ReactElement => (
  <TokenIcon {...token.project} ecosystemId={token.nativeEcosystem} />
);

export interface EcosystemIconProps {
  readonly ecosystemId: EcosystemId;
}

export const EcosystemIcon = ({
  ecosystemId,
}: EcosystemIconProps): ReactElement => {
  const ecosystem = useEcosystem(ecosystemId);
  if (ecosystem === null) {
    throw new Error("Missing ecosystem");
  }
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      {/* TODO: Logo */}
      <EuiIcon type={"ecosystem.logo"} size="m" title={ecosystem.displayName} />
      &nbsp;{ecosystem.displayName}
    </span>
  );
};
