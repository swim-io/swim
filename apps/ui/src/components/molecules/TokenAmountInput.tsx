import {
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiText,
  EuiToolTip,
} from "@elastic/eui";
import type React from "react";

import type { TokenConfig } from "../../config";
import { i18next } from "../../i18n";
import { Amount } from "../../models";
import { EuiFieldIntlNumber } from "../EuiFieldIntlNumber";
import { TokenSelect } from "../TokenSelect";

import { UserBalanceDisplay } from "./UserBalanceDisplay";

interface Props {
  readonly value: string;
  readonly token: TokenConfig;
  readonly tokenOptionIds: readonly string[];
  readonly placeholder: string;
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
  tokenOptionIds,
  placeholder,
  disabled,
  errors,
  onSelectToken,
  onChangeValue,
  onBlur,
  showConstantSwapTip,
}) => {
  const readOnly = !onChangeValue;
  return (
    <EuiFlexGroup>
      <EuiFlexItem>
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
    </EuiFlexGroup>
  );
};
