import { EuiIcon } from "@elastic/eui";
import type { TokenProject } from "@swim-io/token-projects";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ComponentProps, ReactElement } from "react";
import { Fragment } from "react";
import { Trans } from "react-i18next";

import type { EcosystemId, TokenConfig } from "../config";
import { ECOSYSTEMS } from "../config";
import { useIntlListSeparators, useToken } from "../hooks";
import type { TokenOption } from "../models";
import type { Amount } from "../models/amount";

import "./TokenIcon.scss";

interface TokenIconProps
  extends Pick<TokenProject, "icon" | "symbol" | "displayName"> {
  readonly ecosystemId?: EcosystemId;
  readonly showFullName?: boolean;
}

type WithIconProps = ComponentProps<typeof EuiIcon>;
const WithIcon = ({ children, ...rest }: WithIconProps) => {
  return (
    <>
      <EuiIcon {...rest} />
      &nbsp;{children}
    </>
  );
};
export const TokenIcon = ({
  icon,
  symbol,
  displayName,
  ecosystemId,
  showFullName = false,
}: TokenIconProps): ReactElement => {
  const ecosystem = ecosystemId ? ECOSYSTEMS[ecosystemId] : null;
  const tokenName = showFullName ? displayName : symbol;
  return (
    <span className="tokenIconItem">
      {!ecosystem ? (
        <WithIcon type={icon} size="m" title={symbol}>
          {tokenName}
        </WithIcon>
      ) : (
        <Trans
          i18nKey="general.x_token_on_y_ecosystem"
          values={{ tokenName, ecosystemName: ecosystem.displayName }}
          components={{
            tokenIcon: <WithIcon type={icon} size="m" title={symbol} />,
            ecosystemIcon: (
              <WithIcon
                type={ecosystem.logo}
                size="m"
                title={ecosystem.displayName}
              />
            ),
          }}
        />
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
    <span className="tokenIconItem">
      {amount.toFormattedHumanString(ecosystem)}&nbsp;
      <TokenSpecIcon token={amount.tokenConfig} />
    </span>
  );
};

interface AmountsWithTokenIconsProps {
  readonly amounts: readonly Amount[];
}

export const AmountsWithTokenIcons = ({
  amounts,
}: AmountsWithTokenIconsProps): ReactElement => {
  const { comma, conjunction } = useIntlListSeparators({ type: "conjunction" });
  return (
    <>
      {amounts.map((amount, i) => (
        <Fragment key={amount.tokenId}>
          {i > 0 && (
            <span>{i === amounts.length - 1 ? conjunction : comma}</span>
          )}
          <AmountWithTokenIcon
            amount={amount}
            ecosystem={amount.tokenConfig.nativeEcosystemId}
          />
          {i === amounts.length - 1 && <span>.</span>}
        </Fragment>
      ))}
    </>
  );
};

type TokenSpecIconProps = { readonly token: TokenConfig };

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
  const tokenConfig = useToken(tokenId);
  return (
    <TokenIcon
      {...TOKEN_PROJECTS_BY_ID[tokenConfig.projectId]}
      ecosystemId={ecosystemId}
    />
  );
};
