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
import { defaultIfError } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";
import { captureAndWrapException } from "../../errors";
import {
  useGetSwapFormErrorsV2,
  useIsLargeSwapV2,
  useIsRequiredPoolPaused,
  useSwapFeesEstimationQueryV2,
  useSwapOutputAmountEstimateV2,
  useSwapTokensV2,
  useUserBalanceAmount,
  useUserNativeBalances,
} from "../../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteractionV2,
} from "../../hooks/interaction";
import {
  InteractionType,
  getLowBalanceWallets,
  getRequiredPoolsForSwapV2,
} from "../../models";
import { ConfirmModal } from "../ConfirmModal";
import { EstimatedTxFeesCallout } from "../EstimatedTxFeesCallout";
import { LowBalanceDescription } from "../LowBalanceDescription";
import { PoolPausedAlert } from "../PoolPausedAlert";
import { SolanaTpsWarning } from "../SolanaTpsWarning";
import { TokenAmountInputV2 } from "../molecules/TokenAmountInputV2";

import "./SwapFormV2.scss";

interface Props {
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapFormV2 = ({ maxSlippageFraction }: Props): ReactElement => {
  const { t } = useTranslation();
  const config = useEnvironment(selectConfig, shallow);
  const { notify } = useNotification();
  const userNativeBalances = useUserNativeBalances();
  const startNewInteraction = useStartNewInteractionV2(() => {
    setFormInputAmount("0");
  });
  const isInteractionInProgress = useHasActiveInteraction();

  const {
    fromTokenOption,
    toTokenOption,
    fromTokenSpec,
    toTokenSpec,
    setFromTokenOption,
    setToTokenOption,
    fromTokenOptions,
    toTokenOptions,
  } = useSwapTokensV2();
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const requiredPools = getRequiredPoolsForSwapV2(
    config.pools,
    fromTokenOption,
    toTokenOption,
  );

  const isRequiredPoolPaused = useIsRequiredPoolPaused(requiredPools);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactNode | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;

  const [formInputAmount, setFormInputAmount] = useState("0");
  const [inputAmountErrors, setInputAmountErrors] = useState<readonly string[]>(
    [],
  );

  const { data: feesEstimation = null } = useSwapFeesEstimationQueryV2(
    fromTokenOption,
    toTokenOption,
  );

  const inputAmount = defaultIfError(
    () => new Decimal(formInputAmount.replace(/,/g, "")),
    new Decimal(0),
  );

  const isLargeSwap = useIsLargeSwapV2(
    fromTokenOption,
    toTokenOption,
    inputAmount,
  );
  const isSmallEthSwap =
    TOKEN_PROJECTS_BY_ID[fromTokenSpec.projectId].isStablecoin &&
    [fromTokenOption.ecosystemId, toTokenOption.ecosystemId].includes(
      EvmEcosystemId.Ethereum,
    ) &&
    inputAmount.lt(200);
  const getSwapFormErrors = useGetSwapFormErrorsV2(
    fromTokenOption,
    toTokenOption,
    inputAmount,
    maxSlippageFraction,
  );
  const isInputAmountPositive =
    !inputAmount.isNegative() && !inputAmount.isZero();
  const outputAmount = useSwapOutputAmountEstimateV2(
    fromTokenOption,
    toTokenOption,
    inputAmount,
  );
  const fromTokenBalance = useUserBalanceAmount(
    fromTokenSpec,
    fromTokenOption.ecosystemId,
  );
  const outputEcosystemDetail = getTokenDetailsForEcosystem(
    toTokenSpec,
    toTokenOption.ecosystemId,
  );
  const outputAmountString =
    outputAmount !== null && outputEcosystemDetail
      ? outputAmount.toDecimalPlaces(outputEcosystemDetail.decimals).toString()
      : "0";

  const handleInputAmountChange = (
    currentInputAmount: Decimal | null,
  ): void => {
    let errors: readonly string[] = [];
    if (currentInputAmount === null) {
      errors = [...errors, t("general.amount_of_tokens_invalid")];
    } else if (currentInputAmount.isNegative() || currentInputAmount.isZero()) {
      errors = [...errors, t("general.amount_of_tokens_less_than_one")];
    } else if (
      fromTokenBalance &&
      currentInputAmount.gt(
        fromTokenBalance.toHuman(fromTokenOption.ecosystemId),
      )
    ) {
      errors = [...errors, t("general.amount_of_tokens_exceed_balance")];
    } else {
      errors = [];
    }
    setInputAmountErrors(errors);
  };

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
      const swimError = captureAndWrapException(
        t("general.unexpected_error"),
        error,
      );
      setFormErrors([swimError.toPrettyString()]);
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
    if (outputAmount === null || maxSlippageFraction === null) {
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
      type: InteractionType.SwapV2,
      params: {
        fromTokenDetail: {
          ...fromTokenOption,
          value: inputAmount,
        },
        toTokenDetail: {
          ...toTokenOption,
          value: minimumOutputAmount,
        },
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
      <EuiSpacer />

      <TokenAmountInputV2
        value={formInputAmount}
        selectedTokenOption={fromTokenOption}
        tokenOptions={fromTokenOptions}
        placeholder={t("general.enter_amount_of_tokens")}
        disabled={isInteractionInProgress}
        errors={inputAmountErrors}
        onSelectTokenOption={setFromTokenOption}
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
            setFromTokenOption(toTokenOption);
            setToTokenOption(fromTokenOption);
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

      <TokenAmountInputV2
        value={outputAmountString}
        selectedTokenOption={toTokenOption}
        tokenOptions={toTokenOptions}
        placeholder={t("swap_form.output_amount")}
        disabled={isInteractionInProgress}
        errors={[]}
        onSelectTokenOption={setToTokenOption}
        // Never show constant swap on "To Form".
        showConstantSwapTip={false}
      />

      <EuiSpacer />

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

      {requiredPools.some(
        (poolSpec) => poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID,
      ) && <SolanaTpsWarning />}

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
