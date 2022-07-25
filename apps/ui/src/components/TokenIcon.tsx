import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import type { EcosystemId, TokenProject, TokenSpec } from "../config";
import { ECOSYSTEMS } from "../config";
import { useToken } from "../hooks";
import type { TokenOption } from "../models";
import type { Amount } from "../models/amount";

interface TokenIconProps
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
  const ecosystem = ecosystemId ? ECOSYSTEMS[ecosystemId] : null;
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
              type={ecosystem.logo}
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

interface AmountWithTokenIconProps {
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

interface AmountsWithTokenIconsProps {
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

type TokenSpecIconProps = { readonly token: TokenSpec };

export const TokenSpecIcon = ({ token }: TokenSpecIconProps): ReactElement => (
  <TokenIcon {...token.project} ecosystemId={token.nativeEcosystem} />
);

type TokenOptionIconProps = { readonly tokenOption: TokenOption };

export const TokenOptionIcon = ({
  tokenOption,
}: TokenOptionIconProps): ReactElement => {
  const { tokenId, ecosystemId } = tokenOption;
  const tokenSpec = useToken(tokenId);
  return <TokenIcon {...tokenSpec.project} ecosystemId={ecosystemId} />;
};
