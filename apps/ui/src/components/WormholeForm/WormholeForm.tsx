import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiLink,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { ECOSYSTEM_LIST } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";
import {
  TransferStatus,
  useTransfer,
  useUserBalanceAmount,
  useWormholeFromTokenOptionsIds,
} from "../../hooks";
import { ConfirmModal } from "../ConfirmModal";
import { MultiConnectButton } from "../ConnectButton";

import { WormholeTokenInput } from "./WormholeTokenInput";

type TransferResult = {
  readonly message: string;
  readonly data: ReadonlyArray<string>;
  readonly status: TransferStatus;
};
// eslint-disable-next-line functional/prefer-readonly-type
let cacheTransferResults: TransferResult[] = [];

export const WormholeForm = (): ReactElement => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { tokens, ecosystems } = useEnvironment(selectConfig, shallow);
  const fromTokenOptionsIds = useWormholeFromTokenOptionsIds();
  const [formInputAmount, setFormInputAmount] = useState("");
  const [fromEcosystemId, setFromEcosystemId] = useState(ecosystems.solana.id);
  const [toEcosystemId, setToEcosystemId] = useState(ecosystems.ethereum.id);
  const [tokenAddress, setTokenAddress] = useState("");
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [amountErrors, setAmountErrors] = useState<readonly string[]>([]);
  const [fromToken, setFromToken] = useState(
    tokens.filter(
      (token) =>
        token.nativeEcosystemId === ecosystems.solana.id &&
        fromTokenOptionsIds.includes(token.id),
    )[0],
  );
  const fromTokenBalance = useUserBalanceAmount(
    fromToken,
    fromToken.nativeEcosystemId,
  );
  const { handleTransfer, isSending, error } = useTransfer();
  const [transferInfo, setTransferInfo] = useState<readonly TransferResult[]>(
    [],
  );

  const messages = {
    [TransferStatus.BridgedTokens]: t("wormhole_page.message.bridged_tokens"),
    [TransferStatus.FetchingVaa]: t("wormhole_page.message.fetching_vaa"),
    [TransferStatus.FetchedVaa]: t("wormhole_page.message.signed_vaa"),
    [TransferStatus.Transfered]: t("wormhole_page.message.transfer_success"),
  };

  // TODO: to refactor, handling changes with mutations
  const getTransferInfo = (
    status: TransferStatus,
    data: ReadonlyArray<string>,
  ): void => {
    const message = cacheTransferResults.find((item) => item.status === status);
    if (!message) {
      // eslint-disable-next-line functional/immutable-data
      cacheTransferResults.push({
        status,
        message: messages[status],
        data,
      });
    }
  };

  useEffect(() => {
    setTransferInfo(cacheTransferResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheTransferResults.length]);

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
  }, []);

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
  }, [formInputAmount, fromEcosystemId, fromTokenBalance, t]);

  const submitForm = (): void => {
    cacheTransferResults = [];
    notify("Transaction submitted", "Loading...", "info");
    try {
      handleTransfer({
        token: fromToken,
        sourceEcosystemId: fromEcosystemId,
        targetEcosystemId: toEcosystemId,
        amount: formInputAmount,
        getTransferInfo,
      });
    } catch (e) {
      notify("Error", String(e), "error");
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsConfirmModalVisible(true);
  };

  const handleConfirmModalCancel = (): void => {
    setIsConfirmModalVisible(false);
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
            <h2>{t("wormhole_page.title")}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="buttons">
          <MultiConnectButton size="s" fullWidth />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xl" />
      <WormholeTokenInput
        value={formInputAmount}
        token={fromToken}
        label={t("wormhole_page.source_chain")}
        tokenOptionIds={fromTokenOptionsIds}
        tokenAddress={tokenAddress}
        ecosystemId={fromEcosystemId}
        placeholder={"0.00"}
        isDisabled={isSending}
        errors={amountErrors}
        onSelectToken={setFromToken}
        onChangeValue={setFormInputAmount}
        onChangeTokenAddress={setTokenAddress}
        onSelectEcosystem={setFromEcosystemId}
        onBlur={handleBlurTransferAmount}
      />
      <EuiSpacer />
      <EuiFormRow
        labelType="legend"
        label={<span>{t("wormhole_page.target_chain")}</span>}
        fullWidth
      >
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

      <EuiButton
        type="submit"
        fullWidth
        isLoading={isSending}
        isDisabled={
          isSending ||
          amountErrors.length > 0 ||
          fromEcosystemId === toEcosystemId ||
          !formInputAmount
        }
      >
        {isSending
          ? t("wormhole_page.button.bridging")
          : t("wormhole_page.title")}
      </EuiButton>

      {transferInfo.length > 0 && (
        <>
          <EuiSpacer size="l" />
          <EuiCallOut
            color="success"
            style={{ padding: 10, overflowX: "auto" }}
          >
            <h4>{t("wormhole_page.transfer_info")}</h4>
            <ul>
              {transferInfo.map((info: TransferResult) => (
                <li key={info.status} style={{ margin: "5px 0px" }}>
                  <b>{info.message}</b>
                  <div>
                    {info.data.map((tx: string) => (
                      <EuiText size="xs" key={tx}>
                        <div>{`-${tx}`}</div>
                      </EuiText>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </EuiCallOut>
        </>
      )}
      <EuiSpacer size="m" />
      {error !== null && (
        <>
          <EuiCallOut title={t("wormhole_page.error.title")} color="danger">
            <EuiSpacer />
            <span>{t("wormhole_page.error.message")}</span>
            <EuiLink
              href="https://wormholebridge.com/#/redeem"
              target="_blank"
            />
          </EuiCallOut>
        </>
      )}

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
