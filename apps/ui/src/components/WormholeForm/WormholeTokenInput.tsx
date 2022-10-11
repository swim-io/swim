import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from "@elastic/eui";
import { UserBalanceDisplay } from "components/molecules/UserBalanceDisplay";
import type React from "react";

import type { EcosystemId, TokenConfig } from "../../config";
import { EuiFieldIntlNumber } from "../EuiFieldIntlNumber";
import { WormholeTokenSelect } from "./WormholeTokenSelect";

interface Props {
  readonly value: string;
  readonly token: TokenConfig;
  readonly tokenOptionIds: readonly string[];
  readonly placeholder: string;
  readonly tokenAddress: string;
  readonly ecosystemId: EcosystemId;
  readonly errors: readonly string[];
  readonly isDisabled: boolean;
  readonly onSelectEcosystem: (ecosystemId: EcosystemId) => void;
  readonly onChangeTokenAddress: (address: string) => void;
  readonly onSelectToken: (token: TokenConfig) => void;
  readonly onChangeValue: (value: string) => void;
  readonly onBlur: () => void;
}

export const WormholeTokenInput: React.FC<Props> = ({
  value,
  token,
  tokenAddress,
  ecosystemId,
  tokenOptionIds,
  placeholder,
  errors,
  isDisabled,
  onSelectToken,
  onChangeValue,
  onChangeTokenAddress,
  onSelectEcosystem,
  onBlur,
}) => {
  return (
    <EuiFlexGroup alignItems="flexStart">
      <EuiFlexItem>
        <EuiFormRow labelType="legend" label={<span>Source</span>}>
          <WormholeTokenSelect
            tokenAddress={tokenAddress}
            onChangeTokenAddress={onChangeTokenAddress}
            onSelectEcosystemId={onSelectEcosystem}
            onSelectToken={onSelectToken}
            tokenOptionIds={tokenOptionIds}
            token={token}
            selectedEcosystemId={ecosystemId}
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
          <EuiFieldIntlNumber
            placeholder={placeholder}
            value={value}
            step={10 ** -token.nativeDetails.decimals}
            min={0}
            onValueChange={onChangeValue}
            onBlur={onBlur}
            disabled={isDisabled}
            isInvalid={errors.length > 0}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
