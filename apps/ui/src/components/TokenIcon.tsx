import { EuiIcon } from "@elastic/eui";
import type { TokenProject } from "@swim-io/token-projects";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { WormholeToken } from "models";
import type { ComponentProps, ReactElement } from "react";
import { Fragment } from "react";
import { Trans } from "react-i18next";

import { ECOSYSTEMS } from "../config";
import type { EcosystemId, TokenConfig } from "../config";
import { useIntlListSeparators } from "../hooks";
import type { Amount } from "../models/amount";

import "./TokenIcon.scss";

interface TokenIconProps
  extends Pick<TokenProject, "icon" | "symbol" | "displayName"> {
  readonly ecosystemId?: EcosystemId;
  readonly showFullName?: boolean;
}

type WormholeTokenIconProps = {
  readonly token: WormholeToken;
  readonly isSelected: boolean;
};

export const WormholeTokenIcon = ({
  token,
  isSelected,
}: WormholeTokenIconProps): ReactElement => {
  const { logo, symbol, displayName } = token;
  return (
    <div>
      <WithIcon
        type={logo}
        size="m"
        title={displayName}
        style={{ marginRight: 5 }}
      />
      <span>{isSelected ? `${symbol}` : `${symbol} - ${displayName}`}</span>
    </div>
  );
};

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
      <TokenConfigIcon token={amount.tokenConfig} ecosystem={ecosystem} />
    </span>
  );
};

interface AmountsWithTokenIconsProps {
  readonly amounts: readonly Amount[];
  readonly ecosystem?: EcosystemId;
}

export const AmountsWithTokenIcons = ({
  amounts,
  ecosystem,
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
            ecosystem={ecosystem ?? amount.tokenConfig.nativeEcosystemId}
          />
          {i === amounts.length - 1 && <span>.</span>}
        </Fragment>
      ))}
    </>
  );
};

type TokenConfigIconProps = {
  readonly token: TokenConfig;
  readonly ecosystem?: EcosystemId;
};

export const TokenConfigIcon = ({
  token,
  ecosystem,
}: TokenConfigIconProps): ReactElement => (
  <TokenIcon
    {...TOKEN_PROJECTS_BY_ID[token.projectId]}
    ecosystemId={ecosystem ?? token.nativeEcosystemId}
  />
);

export const TokenSearchConfigIcon = ({
  token,
}: Pick<TokenConfigIconProps, "token">): ReactElement => (
  <TokenIcon {...TOKEN_PROJECTS_BY_ID[token.projectId]} />
);
