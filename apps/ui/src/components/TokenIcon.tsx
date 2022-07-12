import shallow from "zustand/shallow.js";

import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import type { EcosystemId, TokenSpec } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import type { Amount } from "../models/amount";

export interface TokenIconProps
  extends Pick<TokenSpec, "icon" | "symbol" | "displayName"> {
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
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const ecosystem = ecosystemId ? ecosystems[ecosystemId] : null;
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
      <NativeTokenIcon {...amount.tokenSpec} />
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

export type NativeTokenIconProps = TokenIconProps &
  Pick<TokenSpec, "nativeEcosystem">;

export const NativeTokenIcon = (props: NativeTokenIconProps): ReactElement => (
  <TokenIcon {...props} ecosystemId={props.nativeEcosystem} />
);

export interface EcosystemIconProps {
  readonly ecosystemId: EcosystemId;
}

export const EcosystemIcon = ({
  ecosystemId,
}: EcosystemIconProps): ReactElement => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const ecosystem = ecosystems[ecosystemId];
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <EuiIcon type={ecosystem.logo} size="m" title={ecosystem.displayName} />
      &nbsp;{ecosystem.displayName}
    </span>
  );
};
