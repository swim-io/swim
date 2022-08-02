import { EuiIcon } from "@elastic/eui";
import type { TokenProject } from "@swim-io/core";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ReactElement } from "react";
import { Fragment } from "react";

import type { EcosystemId, TokenSpec } from "../config";
import { ECOSYSTEMS } from "../config";
import { useToken } from "../hooks";
import type { TokenOption } from "../models";
import type { Amount } from "../models/amount";

import "./TokenIcon.scss";

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
      <EuiIcon className="tokenIcon" type={icon} size="m" title={symbol} />
      &nbsp;<span>{showFullName ? displayName : symbol}</span>
      {ecosystem && (
        <span>
          {" "}
          <span>on</span>{" "}
          <span style={{ whiteSpace: "nowrap" }}>
            <EuiIcon
              className="tokenIcon"
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
          ecosystem={amount.tokenSpec.nativeEcosystemId}
        />
        <span>{i === amounts.length - 1 ? "." : ", "}</span>
      </Fragment>
    ))}
  </>
);

type TokenSpecIconProps = { readonly token: TokenSpec };

export const TokenSpecIcon = ({ token }: TokenSpecIconProps): ReactElement => (
  <TokenIcon
    {...TOKEN_PROJECTS_BY_ID[token.projectId]}
    ecosystemId={token.nativeEcosystemId}
  />
);

type TokenOptionIconProps = { readonly tokenOption: TokenOption };

export const TokenOptionIcon = ({
  tokenOption,
}: TokenOptionIconProps): ReactElement => {
  const { tokenId, ecosystemId } = tokenOption;
  const tokenSpec = useToken(tokenId);
  return (
    <TokenIcon
      {...TOKEN_PROJECTS_BY_ID[tokenSpec.projectId]}
      ecosystemId={ecosystemId}
    />
  );
};
