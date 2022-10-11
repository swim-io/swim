import { EuiIcon } from "@elastic/eui";
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import {
  useUserBalanceAmount,
  useTransfer,
  useWormholeFromTokenOptionsIds,
} from "hooks";

import { FormEvent, ReactElement, useCallback, useMemo } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { ECOSYSTEM_LIST } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";

import { ConfirmModal } from "../ConfirmModal";
import { MultiConnectButton } from "../ConnectButton";
import { WormholeTokenInput } from "./WormholeTokenInput";

export const WormholeForm = (): ReactElement => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { tokens, ecosystems } = useEnvironment(selectConfig, shallow);
  const fromTokenOptionsIds = useWormholeFromTokenOptionsIds();
  const [formInputAmount, setFormInputAmount] = useState("");
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [fromEcosystemId, setFromEcosystemId] = useState(ecosystems.solana.id);
  const [toEcosystemId, setToEcosystemId] = useState(ecosystems.ethereum.id);
  const [tokenAddress, setTokenAddress] = useState("");
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [txInProgress, setTxInProgress] = useState(false);
  const [amountErrors, setAmountErrors] = useState<readonly string[]>([]);
  const fromTokenBalance = useUserBalanceAmount(
    fromToken,
    fromToken.nativeEcosystemId,
  );
  const [error, setError] = useState<string | null>(null);
  const { handleTransfer, isSending, isVAAPending, txId } = useTransfer();

  const selectEcosystemOptions = useMemo(() => {
    return [
      ...ECOSYSTEM_LIST.map((ecosystem) => ({
        value: ecosystem.id,
        inputDisplay: (
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            responsive={false}
          >
            <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
              <EuiIcon
                type={ecosystem.logo}
                size="m"
                title={ecosystem.displayName}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText>{ecosystem.displayName}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
        icon: null,
      })),
    ];
  }, [ECOSYSTEM_LIST, t]);

  const handleBlurTransferAmount = useCallback((): void => {
    let errors: readonly string[] = [];
    if (formInputAmount === "") {
      errors = [...errors, t("general.amount_of_tokens_invalid")];
    } else if (new Decimal(formInputAmount).lte(0)) {
      errors = [...errors, t("general.amount_of_tokens_less_than_one")];
    } else if (
      fromTokenBalance &&
      new Decimal(formInputAmount).gt(
        fromTokenBalance.toHumanString(fromEcosystemId),
      )
    ) {
      errors = [...errors, t("general.amount_of_tokens_exceed_balance")];
    } else {
      errors = [];
    }
    setAmountErrors(errors);
  }, [formInputAmount]);

  const submitForm = async (): Promise<void> => {
    setError(null);
    notify("Transaction submitted", "Loading...", "info");
    try {
      await handleTransfer({
        token: fromToken,
        sourceEcosystemId: fromEcosystemId,
        targetEcosystemId: toEcosystemId,
        amount: formInputAmount,
      });
    } catch (error) {
      setError(String(error));
      notify("Error", String(error), "error");
    }
    setTxInProgress(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsConfirmModalVisible(true);
  };

  const handleConfirmModalCancel = (): void => {
    setIsConfirmModalVisible(false);
    setTxInProgress(false);
  };

  const handleConfirmModalConfirm = (): void => {
    setIsConfirmModalVisible(false);
    submitForm();
  };

  return (
    <EuiForm className="wormholeForm" component="form" onSubmit={handleSubmit}>
      <EuiFlexGroup justifyContent="spaceBetween" responsive={true}>
        <EuiFlexItem grow={true}>
          <EuiTitle>
            <h2>Wormhole</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="buttons">
          <MultiConnectButton size="s" fullWidth />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <WormholeTokenInput
        value={formInputAmount}
        token={fromToken}
        tokenOptionIds={fromTokenOptionsIds}
        tokenAddress={tokenAddress}
        ecosystemId={fromEcosystemId}
        placeholder={"0.00"}
        isDisabled={isSending || isVAAPending}
        errors={amountErrors}
        onSelectToken={setFromToken}
        onChangeValue={setFormInputAmount}
        onChangeTokenAddress={setTokenAddress}
        onSelectEcosystem={setFromEcosystemId}
        onBlur={handleBlurTransferAmount}
      />
      <EuiSpacer />
      <EuiFormRow labelType="legend" label={<span>Target</span>} fullWidth>
        <EuiSuperSelect
          options={selectEcosystemOptions}
          valueOfSelected={toEcosystemId}
          onChange={setToEcosystemId}
          hasDividers
          fullWidth
          style={{ textAlign: "center" }}
        />
      </EuiFormRow>
      <EuiSpacer size="l" />
      {txId && (
        <EuiCallOut color="success">
          <h4>{t("wormhole_page.transaction")}</h4>
          <span>link</span>
        </EuiCallOut>
      )}
      <EuiSpacer size="l" />
      {error !== null && (
        <>
          <EuiCallOut title={t("wormhole_page.error.title")} color="danger">
            <EuiSpacer />
            <span>{t("wormhole_page.error.message")}</span>
            <EuiLink href="https://wormholebridge.com/#/redeem" target="_blank">
              Link
            </EuiLink>
          </EuiCallOut>
          <EuiSpacer />
        </>
      )}
      <EuiButton
        type="submit"
        fullWidth
        isLoading={isSending || isVAAPending}
        isDisabled={
          isSending ||
          txInProgress ||
          amountErrors.length > 0 ||
          fromEcosystemId === toEcosystemId ||
          !formInputAmount
        }
      >
        {txInProgress ? t("recent_interactions.loading") : "Wormhole"}
      </EuiButton>
      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText={t("wormhole_page.confirm_modal.title")}
        cancelText={t("wormhole_page.confirm_modal.cancel")}
        confirmText={t("wormhole_page.confirm_modal.transfer")}
        promptText={t("wormhole_page.confirm_modal.question")}
      />
    </EuiForm>
  );
};
