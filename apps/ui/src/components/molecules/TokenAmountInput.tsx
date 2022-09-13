import {
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiText,
  EuiToolTip,
} from "@elastic/eui";
import { NetworkSelect } from "components/NetworkSelect";
import type React from "react";

import type { Ecosystem, TokenConfig } from "../../config";
import { i18next } from "../../i18n";
import { Amount } from "../../models";
import { ConnectButton } from "../ConnectButton";
import { EuiFieldIntlNumber } from "../EuiFieldIntlNumber";
import { TokenSelect } from "../TokenSelect";

import { UserBalanceDisplay } from "./UserBalanceDisplay";

interface Props {
  readonly value: string;
  readonly token: TokenConfig;
  readonly network: Ecosystem;
  readonly tokenOptionIds: readonly string[];
  readonly placeholder: string;
  readonly onSelectNetwork: (networkId: string) => void;
  readonly onSelectToken: (token: TokenConfig) => void;
  readonly onChangeValue?: (value: string) => void;
  readonly onBlur?: () => void;
  readonly disabled: boolean;
  readonly errors: readonly string[];
  readonly showConstantSwapTip: boolean;
}

const getReadonlyDisplayValue = (token: TokenConfig, value: string) => {
  if (!value) {
    return "";
  }
  return Amount.fromHumanString(token, value).toFormattedHumanString(
    token.nativeEcosystemId,
  );
};

// TODO: Make code DRY.
const getTokenLabel = (): React.ReactElement => {
  return (
    <EuiText size="xs">
      <p>
        <span>{i18next.t("swap_form.constant_product_swap")}&nbsp;&nbsp;</span>
        <EuiToolTip
          position="right"
          content={i18next.t("pool_page.pool_price_explanation")}
        >
          <EuiIcon size="m" type="questionInCircle" color="primary" />
        </EuiToolTip>
      </p>
    </EuiText>
  );
};

export const TokenAmountInput: React.FC<Props> = ({
  value,
  token,
  network,
  tokenOptionIds,
  placeholder,
  disabled,
  errors,
  onSelectNetwork,
  onSelectToken,
  onChangeValue,
  onBlur,
  showConstantSwapTip,
}) => {
  const readOnly = !onChangeValue;
  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={1}>
        <EuiFormRow
          hasEmptyLabelSpace={!showConstantSwapTip}
          // TODO: Preferably leave pool logic out a token-related component.
          label={showConstantSwapTip ? getTokenLabel() : null}
        >
          <TokenSelect
            onSelectToken={onSelectToken}
            tokenOptionIds={tokenOptionIds}
            token={token}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiFormRow
          hasEmptyLabelSpace={!showConstantSwapTip}
          label={showConstantSwapTip ? getTokenLabel() : null}
        >
          <NetworkSelect
            onSelectNetwork={onSelectNetwork}
            network={network}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          labelType="legend"
          labelAppend={
            <UserBalanceDisplay
              token={token}
              ecosystemId={token.nativeEcosystemId}
              onClick={
                onChangeValue
                  ? (newAmount) =>
                      onChangeValue(
                        newAmount.toHumanString(token.nativeEcosystemId),
                      )
                  : undefined
              }
            />
          }
          isInvalid={errors.length > 0}
          error={errors}
        >
          {readOnly ? (
            <EuiFieldText
              value={getReadonlyDisplayValue(token, value)}
              controlOnly
              placeholder={placeholder}
              readOnly
            />
          ) : (
            <EuiFieldIntlNumber
              placeholder={placeholder}
              value={value}
              step={10 ** -token.nativeDetails.decimals}
              min={0}
              onValueChange={onChangeValue}
              disabled={disabled}
              onBlur={onBlur}
              isInvalid={errors.length > 0}
            />
          )}
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem style={{ minWidth: "180px" }}>
        <EuiFormRow hasEmptyLabelSpace>
          <ConnectButton ecosystemId={token.nativeEcosystemId} fullWidth />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
