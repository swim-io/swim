import { EuiIcon } from "@elastic/eui";
import type { TokenProject } from "@swim-io/token-projects";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ComponentProps, ReactElement } from "react";
import { Fragment } from "react";
import { Trans } from "react-i18next";

import type { Ecosystem, EcosystemId, TokenConfig } from "../config";
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

interface NetworkIconProps {
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
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

export const NetworkIcon = ({
  displayName,
  logo,
  nativeTokenSymbol,
}: NetworkIconProps): ReactElement => {
  return (
    <span className="tokenIconItem">
      <WithIcon type={logo} size="m" title={nativeTokenSymbol}>
        {displayName}
      </WithIcon>
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
      <TokenConfigIcon token={amount.tokenConfig} />
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

type TokenConfigIconProps = { readonly token: TokenConfig };
type NetworkConfigIconProps = { readonly network: Ecosystem };

export const TokenConfigIcon = ({
  token,
}: TokenConfigIconProps): ReactElement => (
  <TokenIcon
    {...TOKEN_PROJECTS_BY_ID[token.projectId]}
    ecosystemId={token.nativeEcosystemId}
  />
);

export const TokenSearchConfigIcon = ({
  token,
}: TokenConfigIconProps): ReactElement => (
  <TokenIcon {...TOKEN_PROJECTS_BY_ID[token.projectId]} />
);

export const NetworkConfigIcon = ({
  network,
}: NetworkConfigIconProps): ReactElement => <NetworkIcon {...network} />;

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
