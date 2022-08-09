import {
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiText,
  EuiToolTip,
} from "@elastic/eui";
import type React from "react";

import type { TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { useToken } from "../../hooks";
import { i18next } from "../../i18n";
import type { TokenOption } from "../../models";
import { Amount } from "../../models";
import { ConnectButton } from "../ConnectButton";
import { TokenSelectV2 } from "../TokenSelectV2";

import { UserBalanceDisplay } from "./UserBalanceDisplay";

interface Props {
  readonly value: string;
  readonly selectedTokenOption: TokenOption;
  readonly tokenOptions: readonly TokenOption[];
  readonly placeholder: string;
  readonly onSelectTokenOption: (tokenOption: TokenOption) => void;
  readonly onChangeValue?: (value: string) => void;
  readonly onBlur?: () => void;
  readonly disabled: boolean;
  readonly errors: readonly string[];
  readonly showConstantSwapTip: boolean;
}

const getReadonlyDisplayValue = (token: TokenSpec, value: string) => {
  if (!value) {
    return "";
  }
  return Amount.fromHumanString(token, value).toFormattedHumanString(
    token.nativeEcosystemId,
  );
};

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

export const TokenAmountInputV2: React.FC<Props> = ({
  value,
  selectedTokenOption,
  tokenOptions,
  placeholder,
  disabled,
  errors,
  onSelectTokenOption,
  onChangeValue,
  onBlur,
  showConstantSwapTip,
}) => {
  const { tokenId, ecosystemId } = selectedTokenOption;
  const token = useToken(tokenId);

  const tokenDetails = getTokenDetailsForEcosystem(token, ecosystemId);
  if (tokenDetails === null) {
    throw new Error("Native token details not found");
  }

  const readOnly = !onChangeValue;

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={2}>
        <EuiFormRow
          hasEmptyLabelSpace={!showConstantSwapTip}
          // TODO: Preferably leave pool logic out a token-related component.
          label={showConstantSwapTip ? getTokenLabel() : null}
        >
          <TokenSelectV2
            onSelectTokenOption={onSelectTokenOption}
            tokenOptions={tokenOptions}
            selectedTokenOption={selectedTokenOption}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          labelType="legend"
          labelAppend={
            <UserBalanceDisplay
              token={token}
              ecosystemId={ecosystemId}
              onClick={
                onChangeValue
                  ? (newAmount) =>
                      onChangeValue(newAmount.toHumanString(ecosystemId))
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
            <EuiFieldNumber
              placeholder={placeholder}
              value={value}
              step={10 ** -tokenDetails.decimals}
              min={0}
              onChange={(e) => onChangeValue(e.target.value)}
              disabled={disabled}
              onBlur={onBlur}
              isInvalid={errors.length > 0}
            />
          )}
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem style={{ minWidth: "180px" }}>
        <EuiFormRow hasEmptyLabelSpace>
          <ConnectButton ecosystemId={ecosystemId} fullWidth />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
