import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
} from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { defaultIfError } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { EcosystemId, getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useNotification } from "../../core/store";
import { captureAndWrapException } from "../../errors";
import {
  useSwapFeesEstimationQueryV2,
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

  // TODO: get required pool status
  const isRequiredPoolPaused = (() => false)();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactNode | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;

  const [formInputAmount, setFormInputAmount] = useState("0");
  const [inputAmountErrors, setInputAmountErrors] = useState<readonly string[]>(
    [],
  );

  const feesEstimation = useSwapFeesEstimationQueryV2(
    fromTokenOption,
    toTokenOption,
  );

  const inputAmount = defaultIfError(
    () => new Decimal(formInputAmount.replace(/,/g, "")),
    new Decimal(0),
  );

  // TODO: create V2 of these check
  const isLargeSwap = (() => false)();
  const isSmallEthSwap =
    TOKEN_PROJECTS_BY_ID[fromTokenSpec.projectId].isStablecoin &&
    [fromTokenOption.ecosystemId, toTokenOption.ecosystemId].includes(
      EcosystemId.Ethereum,
    ) &&
    inputAmount.lt(200);
  const getSwapFormErrors = (_: boolean) => [];
  const isInputAmountPositive = (() => true)();
  const outputAmount = inputAmount;
  const fromTokenBalance = useUserBalanceAmount(
    fromTokenSpec,
    fromTokenOption.ecosystemId,
  );
  const outputEcosystemDetail = getTokenDetailsForEcosystem(
    toTokenSpec,
    toTokenOption.ecosystemId,
  );
  const outputAmountString = outputEcosystemDetail
    ? outputAmount.toPrecision(outputEcosystemDetail.decimals)
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
        "You're trying to swap >10% of the pool size which may impact the price.",
      );
    } else if (isSmallEthSwap) {
      setConfirmModalDescription(
        "The Ethereum gas fees might be high relative to the swap amount.",
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
    if (
      // outputAmount === null ||
      // !isEachNotNull(poolMaths) ||
      maxSlippageFraction === null
    ) {
      notify(
        t("general.unexpected_form_error_title"),
        t("general.unexpected_form_error_description"),
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
          aria-label="Flip direction"
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
        placeholder={"Output"}
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
        (poolSpec) => poolSpec.ecosystem === EcosystemId.Solana,
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
