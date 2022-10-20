import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_SOLANA, CHAIN_ID_TO_NAME } from "@certusone/wormhole-sdk";
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId } from "../../config";
import { wormholeTokens as rawWormholeTokens } from "../../config";
import { useNotification } from "../../core/store";
import { useUserSolanaTokenBalance, useWormholeTransfer } from "../../hooks";
import { useWormholeErc20BalanceQuery } from "../../hooks/wormhole/useWormholeErc20BalanceQuery";
import { generateId } from "../../models";
import type {
  TxResult,
  WormholeToken,
  WormholeTokenDetails,
} from "../../models";
import { ConfirmModal } from "../ConfirmModal";
import { MultiConnectButton } from "../ConnectButton";
import { EuiFieldIntlNumber } from "../EuiFieldIntlNumber";
import { TxListItem } from "../molecules/TxListItem";

import WormholeChainSelect from "./WormholeChainSelect";
import { WormholeTokenSelect } from "./WormholeTokenSelect";

import "./WormholeForm.scss";

const getDetailsByChainId = (
  token: WormholeToken,
  chainId: ChainId,
): WormholeTokenDetails =>
  findOrThrow(
    [token.nativeDetails, ...token.wrappedDetails],
    (details) => details.chainId === chainId,
  );

export const WormholeForm = (): ReactElement => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputAmount, setInputAmount] = useState(new Decimal(0));
  const [txResults, setTxResults] = useState<readonly TxResult[]>([]);
  const [amountErrors, setAmountErrors] = useState<readonly string[]>([]);
  const wormholeTokens = rawWormholeTokens as readonly WormholeToken[];
  const { mutateAsync: transfer, isLoading } = useWormholeTransfer();

  const [currentTokenSymbol, setCurrentTokenSymbol] = useState(
    wormholeTokens[0].symbol,
  );
  const currentToken = findOrThrow(
    wormholeTokens,
    (token) => token.symbol === currentTokenSymbol,
  );

  const sourceChains = useMemo(
    () => [
      currentToken.nativeDetails.chainId,
      ...currentToken.wrappedDetails.map(({ chainId }) => chainId),
    ],
    [currentToken],
  );
  const [sourceChainId, setSourceChainId] = useState(sourceChains[0]);

  const targetChains = useMemo(
    () => sourceChains.filter((option) => option !== sourceChainId),
    [sourceChains, sourceChainId],
  );
  const [targetChainId, setTargetChainId] = useState(targetChains[0]);

  const sourceDetails = getDetailsByChainId(currentToken, sourceChainId);
  const targetDetails = getDetailsByChainId(currentToken, targetChainId);
  const splBalance = useUserSolanaTokenBalance(
    sourceChainId === CHAIN_ID_SOLANA ? sourceDetails : null,
    { enabled: sourceChainId === CHAIN_ID_SOLANA },
  );
  const { data: erc20Balance = null } =
    useWormholeErc20BalanceQuery(sourceDetails);
  const balance = splBalance ?? erc20Balance;

  const handleTxResult = (txResult: TxResult): void => {
    setTxResults((previousResults) => [...previousResults, txResult]);
  };

  const handleSubmit = () => {
    (async (): Promise<void> => {
      setTxResults([]);
      setError(null);
      await transfer({
        interactionId: generateId(),
        value: inputAmount,
        sourceDetails,
        targetDetails,
        nativeDetails: currentToken.nativeDetails,
        onTxResult: handleTxResult,
      });
    })().catch((e) => {
      console.error(e);
      notify("Error", String(e), "error");
      setError(String(e));
    });
  };

  const handleConfirmSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsConfirmModalVisible(true);
  };

  useEffect(() => {
    setSourceChainId(sourceChains[0]);
  }, [sourceChains]);

  useEffect(() => {
    if (targetChainId === sourceChainId) {
      setTargetChainId(targetChains[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetChains]);

  const handleConfirmModalCancel = (): void => {
    setIsConfirmModalVisible(false);
  };

  const handleConfirmModalConfirm = (): void => {
    setIsConfirmModalVisible(false);
    handleSubmit();
  };

  const checkAmountErrors = useCallback(
    (value: Decimal) => {
      let errors: readonly string[] = [];
      if (value.isNeg()) {
        errors = [...errors, t("general.amount_of_tokens_invalid")];
      } else if (value.lte(0)) {
        errors = [...errors, t("general.amount_of_tokens_less_than_one")];
      } else if (!balance || new Decimal(value).gt(balance)) {
        errors = [...errors, t("general.amount_of_tokens_exceed_balance")];
      } else {
        errors = [];
      }
      setAmountErrors(errors);
    },
    [balance, t],
  );

  const handleTransferAmountChange = useCallback(
    (value: string): void => {
      let newValue = new Decimal(0);
      if (value === "") {
        setInputAmount(new Decimal(0));
      } else {
        setInputAmount(new Decimal(value));
        newValue = new Decimal(value);
      }
      checkAmountErrors(newValue);
    },
    [checkAmountErrors],
  );

  return (
    <EuiForm
      component="form"
      className="wormholeForm"
      onSubmit={handleConfirmSubmit}
    >
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>{t("wormhole_page.title")}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="buttons">
          <MultiConnectButton size="s" fullWidth />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xxl" />
      <EuiFlexGroup alignItems="flexStart">
        <EuiFlexItem className="formItem">
          <EuiFormRow label="Token">
            <WormholeTokenSelect
              tokens={wormholeTokens}
              selectedToken={currentToken}
              onSelectToken={(token: WormholeToken) =>
                setCurrentTokenSymbol(token.symbol)
              }
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem className="formItem">
          <EuiFormRow
            labelType="legend"
            labelAppend={
              <EuiText size="s">
                {`${t("swap_form.user_balance")} ${balance?.toString() || "-"}`}
              </EuiText>
            }
            isInvalid={amountErrors.length > 0}
            error={amountErrors}
          >
            <EuiFieldIntlNumber
              placeholder={"0.00"}
              value={!inputAmount.isZero() ? inputAmount.toString() : ""}
              step={10 ** -currentToken.nativeDetails.decimals}
              min={0}
              onValueChange={handleTransferAmountChange}
              onBlur={() => checkAmountErrors(inputAmount)}
              isInvalid={amountErrors.length > 0}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xxl" />
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem>
          <WormholeChainSelect
            chains={sourceChains}
            selectedChainId={sourceChainId}
            onSelectChain={setSourceChainId}
            label={t("wormhole_page.source_chain")}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <WormholeChainSelect
            chains={targetChains}
            selectedChainId={targetChainId}
            onSelectChain={setTargetChainId}
            label={t("wormhole_page.target_chain")}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      {!inputAmount.isZero() && amountErrors.length === 0 && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="s">
            {t("wormhole_page.receiving_amount", {
              amount: inputAmount,
              token: currentToken.symbol,
            })}
          </EuiText>
        </>
      )}
      <EuiSpacer size="l" />
      <EuiButton
        type="submit"
        fullWidth
        fill
        isLoading={isLoading}
        isDisabled={
          isLoading || inputAmount.isZero() || amountErrors.length > 0
        }
      >
        {isLoading
          ? t("wormhole_page.button.bridging")
          : t("wormhole_page.button.transfer")}
      </EuiButton>
      <EuiSpacer size="l" />
      {txResults.length > 0 && (
        <>
          <EuiSpacer size="l" />
          <EuiCallOut color="success" className="transactions">
            <h4>{t("wormhole_page.transfer_info")}</h4>
            <div>
              {txResults.map(({ chainId, txId }) => (
                <div key={txId} style={{ margin: "5px 0px" }}>
                  <EuiText size="xs" key={txId}>
                    <TxListItem
                      ecosystem={CHAIN_ID_TO_NAME[chainId] as EcosystemId}
                      txId={txId}
                    />
                  </EuiText>
                </div>
              ))}
            </div>
          </EuiCallOut>
        </>
      )}
      {error !== null && txResults.length > 0 && (
        <>
          <EuiSpacer size="l" />
          <EuiCallOut title={t("wormhole_page.error.title")} color="danger">
            <EuiSpacer />
            <span>{t("wormhole_page.error.message")}</span>
            <EuiLink
              href="https://wormholebridge.com/#/redeem"
              target="_blank"
            />
            <p>{error}</p>
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