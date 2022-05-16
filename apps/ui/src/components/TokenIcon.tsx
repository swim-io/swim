import { EuiFlexGrid, EuiFlexItem, EuiIcon, EuiText, useEuiTheme } from "@elastic/eui";
import type { HTMLAttributes, ReactElement } from "react";
import { Fragment } from "react";

import type { EcosystemId, TokenSpec } from "../config";
import { ecosystems } from "../config";
import type { Amount } from "../models/amount";

export interface TokenIconProps
  extends Pick<TokenSpec, "icon" | "symbol" | "displayName">,
    HTMLAttributes<HTMLDivElement> {
  readonly ecosystemId?: EcosystemId;
  readonly showFullName?: boolean;
}

/* eslint-disable react/jsx-key */
export const TokenIcon = ({
                            icon,
                            symbol,
                            displayName,
                            ecosystemId,
                            showFullName = false,
                            style
                          }: TokenIconProps): ReactElement => {
  const ecosystem = ecosystemId ? ecosystems[ecosystemId] : null;
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGrid gutterSize={"s"} style={style}>
      <EuiFlexItem grow={false}>
        <EuiIcon type={icon} size="l" title={symbol} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText>{showFullName ? displayName : symbol}</EuiText>
      </EuiFlexItem>
      {ecosystem && [
        <EuiFlexItem grow={false}>
          <EuiText>on</EuiText>
        </EuiFlexItem>,
        <EuiFlexItem grow={false}>
          <EuiIcon type={ecosystem.logo} size="l" />
        </EuiFlexItem>,
        <EuiFlexItem grow={false}>
          <EuiText>{ecosystem.displayName}</EuiText>
        </EuiFlexItem>
      ]}
    </EuiFlexGrid>
  );
};

/* eslint-enable react/jsx-key */

export interface AmountWithTokenIconProps {
  readonly amount: Amount;
  readonly ecosystem: EcosystemId;
}

export const AmountWithTokenIcon = ({
                                      amount,
                                      ecosystem
                                    }: AmountWithTokenIconProps): ReactElement => {
  return (
    <span>
      {amount.toFormattedHumanString(ecosystem)}{" "}
      <NativeTokenIcon {...amount.tokenSpec} />
    </span>
  );
};

export interface AmountsWithTokenIconsProps {
  readonly amounts: readonly Amount[];
}

export const AmountsWithTokenIcons = ({
                                        amounts
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

export type NativeTokenIconProps = TokenIconProps &
  Pick<TokenSpec, "nativeEcosystem">;

export const NativeTokenIcon = (props: NativeTokenIconProps): ReactElement => (
  <TokenIcon {...props} ecosystemId={props.nativeEcosystem} />
);

export interface EcosystemIconProps {
  readonly ecosystemId: EcosystemId;
}

export const EcosystemIcon = ({
                                ecosystemId
                              }: EcosystemIconProps): ReactElement => {
  const ecosystem = ecosystems[ecosystemId];
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <EuiIcon type={ecosystem.logo} size="m" title={ecosystem.displayName} />
      &nbsp;{ecosystem.displayName}
    </span>
  );
};
