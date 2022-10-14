import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
} from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { defaultIfError, isEachNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";
import { captureAndWrapException } from "../../errors";
import {
  useGetSwapFormErrors,
  useIsLargeSwap,
  usePoolMaths,
  usePools,
  useSwapFeesEstimationQuery,
  useSwapOutputAmountEstimate,
  useSwapTokensContext,
  useUserBalanceAmount,
  useUserNativeBalances,
  useUserSolanaTokenAccountsQuery,
} from "../../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteraction,
} from "../../hooks/interaction";
import {
  Amount,
  InteractionType,
  getLowBalanceWallets,
  getRequiredPoolsForSwap,
} from "../../models";
import { ConfirmModal } from "../ConfirmModal";
import { EstimatedTxFeesCallout } from "../EstimatedTxFeesCallout";
import { LowBalanceDescription } from "../LowBalanceDescription";
import { PoolPausedAlert } from "../PoolPausedAlert";
import { SolanaTpsWarning } from "../SolanaTpsWarning";
import { SwapFormSolanaConnectButton } from "../molecules/SwapFormSolanaConnectButton";
import { TokenAmountInput } from "../molecules/TokenAmountInput";

import "./SwapForm.scss";

interface Props {
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapForm = ({ maxSlippageFraction }: Props): ReactElement => {
  const { t } = useTranslation();
  const config = useEnvironment(selectConfig, shallow);
  const { notify } = useNotification();
  const { data: splTokenAccounts = null } = useUserSolanaTokenAccountsQuery();
  const startNewInteraction = useStartNewInteraction(() => {
    setFormInputAmount("");
  });
  const isInteractionInProgress = useHasActiveInteraction();
  const {
    fromToken,
    toToken,
    fromTokenOptionsIds,
    toTokenOptionsIds,
    setFromToken,
    setToToken,
    setFromAndToTokens,
    hasUrlError,
  } = useSwapTokensContext();

  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const requiredPools = getRequiredPoolsForSwap(
    config.pools,
    fromToken.id,
    toToken.id,
  );
  const poolIds = requiredPools.map((pool) => pool.id);
  const pools = usePools(poolIds);
  const isRequiredPoolPaused = pools.some((pool) => pool.isPoolPaused);
  const poolMaths = usePoolMaths(poolIds);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactNode | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;

  const [formInputAmount, setFormInputAmount] = useState("");
  const [inputAmountErrors, setInputAmountErrors] = useState<readonly string[]>(
    [],
  );

  const feesEstimation = useSwapFeesEstimationQuery(fromToken, toToken);
  const userNativeBalances = useUserNativeBalances([
    fromToken.nativeEcosystemId,
    toToken.nativeEcosystemId,
  ]);

  const inputAmount = defaultIfError(
    () => Amount.fromHumanString(fromToken, formInputAmount),
    Amount.zero(fromToken),
  );

  const isLargeSwap = useIsLargeSwap(fromToken, toToken, inputAmount);
  const isSmallEthSwap =
    TOKEN_PROJECTS_BY_ID[fromToken.projectId].isStablecoin &&
    [fromToken.nativeEcosystemId, toToken.nativeEcosystemId].includes(
      EvmEcosystemId.Ethereum,
    ) &&
    inputAmount.toHuman(SOLANA_ECOSYSTEM_ID).lt(200);

  const getSwapFormErrors = useGetSwapFormErrors(
    fromToken,
    toToken,
    inputAmount,
    maxSlippageFraction,
  );
  const isInputAmountPositive =
    !inputAmount.isNegative() && !inputAmount.isZero();

  const outputAmount = useSwapOutputAmountEstimate(inputAmount, toToken);
  const fromTokenBalance = useUserBalanceAmount(
    fromToken,
    fromToken.nativeEcosystemId,
  );

  const handleInputAmountChange = (currentInputAmount: Amount | null): void => {
    let errors: readonly string[] = [];
    if (currentInputAmount === null) {
      errors = [...errors, t("general.amount_of_tokens_invalid")];
    } else if (currentInputAmount.isNegative() || currentInputAmount.isZero()) {
      errors = [...errors, t("general.amount_of_tokens_less_than_one")];
    } else if (fromTokenBalance && currentInputAmount.gt(fromTokenBalance)) {
      errors = [...errors, t("general.amount_of_tokens_exceed_balance")];
    } else if (
      currentInputAmount.requiresRounding(fromToken.nativeEcosystemId)
    ) {
      errors = [...errors, t("general.amount_of_tokens_too_many_decimals")];
    } else {
      errors = [];
    }
    setInputAmountErrors(errors);
  };

  // re-validate input amount after user connected a wallet
  const fromTokenBalancePrimitive = fromTokenBalance?.toPrimitive();
  useEffect(() => {
    if (fromTokenBalancePrimitive && !inputAmount.isZero()) {
      handleInputAmountChange(inputAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTokenBalancePrimitive]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const lowBalanceWallets = getLowBalanceWallets(
      feesEstimation,
      userNativeBalances,
    );
    if (lowBalanceWallets.length > 0) {
      setConfirmModalDescription(
        <LowBalanceDescription lowBalanceWallets={lowBalanceWallets} />,
      );
    } else if (isLargeSwap) {
      setConfirmModalDescription(
        t("swap_form.require_warning_swap_too_large_amount", {
          percentage: 10,
        }),
      );
    } else if (isSmallEthSwap) {
      setConfirmModalDescription(
        t("swap_form.require_warning_gas_fee_may_be_high"),
      );
    } else {
      handleSwapAndCatch(false);
    }
  };

  const handleSwapAndCatch = (allowLargeSwap: boolean): void => {
    if (isSubmitted) {
      return;
    }
    try {
      setIsSubmitted(true);
      handleSwap(allowLargeSwap);
    } catch (error) {
      const swimUiError = captureAndWrapException(
        t("general.unexpected_error"),
        error,
      );
      setFormErrors([swimUiError.toPrettyString()]);
    } finally {
      setIsSubmitted(false);
    }
  };

  const handleSwap = (allowLargeSwap: boolean): void => {
    const errors = getSwapFormErrors(allowLargeSwap);
    setFormErrors(errors);

    if (errors.length > 0) {
      return;
    }

    // These are just for type safety and should in theory not happen
    if (
      splTokenAccounts === null ||
      outputAmount === null ||
      maxSlippageFraction === null ||
      !isEachNotNull(poolMaths)
    ) {
      notify(
        t("notify.unexpected_form_error_title"),
        t("notify.unexpected_form_error_description"),
        "error",
      );
      return;
    }

    const minimumOutputAmount = outputAmount.sub(
      outputAmount.mul(maxSlippageFraction),
    );
    startNewInteraction({
      type: InteractionType.Swap,
      params: {
        exactInputAmount: inputAmount,
        minimumOutputAmount,
      },
    });
  };

  const handleConfirmModalCancel = (): void => {
    setConfirmModalDescription(null);
  };

  const handleConfirmModalConfirm = (): void => {
    setConfirmModalDescription(null);
    handleSwapAndCatch(true);
  };
  const isStableSwap = requiredPools.every((pool) => pool.isStableSwap);
  return (
    <EuiForm component="form" className="swapForm" onSubmit={handleSubmit}>
      {hasUrlError && (
        <EuiCallOut title={t("swap_page.invalid_swap_url")} color="danger" />
      )}
      <EuiSpacer />
      <TokenAmountInput
        value={formInputAmount}
        token={fromToken}
        tokenOptionIds={fromTokenOptionsIds}
        placeholder={"0.00"}
        disabled={isInteractionInProgress}
        errors={inputAmountErrors}
        onSelectToken={setFromToken}
        onChangeValue={setFormInputAmount}
        onBlur={() => handleInputAmountChange(inputAmount)}
        showConstantSwapTip={!isStableSwap}
      />
      <EuiSpacer size="m" />
      <div style={{ textAlign: "center" }}>
        <EuiButtonIcon
          iconType={"merge"}
          size="m"
          iconSize="xl"
          onClick={() => {
            setFromAndToTokens(toToken, fromToken);
          }}
          className="swapForm__flipIcon"
          aria-label={t("swap_form.flip_direction_button")}
          disabled={isInteractionInProgress}
        />
      </div>
      <EuiSpacer
        size="m"
        className="eui-hideFor--m eui-hideFor--l eui-hideFor--xl"
      />
      <TokenAmountInput
        value={outputAmount?.toHumanString(toToken.nativeEcosystemId) ?? ""}
        token={toToken}
        tokenOptionIds={toTokenOptionsIds}
        placeholder={t("swap_form.output_amount")}
        disabled={isInteractionInProgress}
        errors={[]}
        onSelectToken={setToToken}
        // Never show constant swap on "To Form".
        showConstantSwapTip={false}
      />
      <EuiSpacer />
      <SwapFormSolanaConnectButton
        fromEcosystem={fromToken.nativeEcosystemId}
        toEcosystem={toToken.nativeEcosystemId}
      />
      {isInputAmountPositive && (
        <EstimatedTxFeesCallout feesEstimation={feesEstimation} />
      )}
      {formErrors.length > 0 && (
        <>
          <EuiCallOut
            title={t("general.please_fix_issues_in_form")}
            color="danger"
          >
            <ul>
              {formErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </EuiCallOut>
          <EuiSpacer />
        </>
      )}
      <SolanaTpsWarning />
      <PoolPausedAlert isVisible={isRequiredPoolPaused} />
      <EuiFormRow fullWidth>
        <EuiButton
          type="submit"
          fullWidth
          fill
          isLoading={isInteractionInProgress}
          isDisabled={isRequiredPoolPaused || isSubmitted}
        >
          {t("swap_form.swap_button")}
        </EuiButton>
      </EuiFormRow>
      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText={t("swap_modal.title")}
        cancelText={t("general.cancel_button")}
        confirmText={t("swap_modal.confirm_button")}
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
