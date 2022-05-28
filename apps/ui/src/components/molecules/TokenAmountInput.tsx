import {
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiSuperSelect,
  EuiText,
  EuiToolTip,
} from "@elastic/eui";
import type React from "react";
import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../../config";
import { getNativeTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { Amount } from "../../models";
import { findOrThrow } from "../../utils";
import { ConnectButton } from "../ConnectButton";
import { NativeTokenIcon } from "../TokenIcon";

import { UserBalanceDisplay } from "./UserBalanceDisplay";

interface Props {
  readonly value: string;
  readonly token: TokenSpec;
  readonly tokenOptionIds: readonly string[];
  readonly placeholder: string;
  readonly onSelectToken: (tokenId: string) => void;
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
    token.nativeEcosystem,
  );
};

// TODO: Make code DRY.
const getTokenLabel = (): React.ReactElement => {
  return (
    <EuiText size="xs">
      <p>
        {"Constant product swap  "}
        <EuiToolTip
          position="right"
          content="This pool uses a constant product curve, prices deviate from 1:1."
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
  const { tokens } = useEnvironment(selectConfig, shallow);
  const options = tokenOptionIds
    .map((tokenId) => findOrThrow(tokens, ({ id }) => id === tokenId))
    .map((tokenSpec) => ({
      value: tokenSpec.id,
      inputDisplay: <NativeTokenIcon {...tokenSpec} />,
    }));
  const { nativeEcosystem } = token;
  const tokenNativeDetails = getNativeTokenDetails(token);
  const readOnly = !onChangeValue;

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={2}>
        <EuiFormRow
          hasEmptyLabelSpace={!showConstantSwapTip}
          // TODO: Preferably leave pool logic out a token-related component.
          label={showConstantSwapTip ? getTokenLabel() : null}
        >
          <EuiSuperSelect
            options={options}
            valueOfSelected={token.id}
            onChange={onSelectToken}
            itemLayoutAlign="top"
            disabled={disabled}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          labelType="legend"
          labelAppend={
            <UserBalanceDisplay
              token={token}
              onClick={
                onChangeValue
                  ? (newAmount) =>
                      onChangeValue(newAmount.toHumanString(nativeEcosystem))
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
              step={10 ** -tokenNativeDetails.decimals}
              min={0}
              onChange={(e) => onChangeValue && onChangeValue(e.target.value)}
              disabled={disabled}
              onBlur={onBlur}
              isInvalid={errors.length > 0}
            />
          )}
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem style={{ minWidth: "180px" }}>
        <EuiFormRow hasEmptyLabelSpace>
          <ConnectButton ecosystemId={nativeEcosystem} fullWidth />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
