import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import shallow from "zustand/shallow.js";

import { EcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  useSwapFeesEstimationQueryV2,
  useSwapTokensV2,
  useUserBalanceAmounts,
  useUserNativeBalances,
} from "../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteractionV2,
} from "../hooks/interaction";
import {
  InteractionType,
  getLowBalanceWallets,
  getRequiredPoolsForSwapV2,
} from "../models";
import { defaultIfError } from "../utils";

import { ConfirmModal } from "./ConfirmModal";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { TokenAmountInputV2 } from "./molecules/TokenAmountInputV2";

import "./SwapForm.scss";

export interface SwapFormProps {
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapFormV2 = ({
  maxSlippageFraction,
}: SwapFormProps): ReactElement => {
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
  const isSmallEthSwap = (() => false)();
  const getSwapFormErrors = (_: boolean) => [];
  const isInputAmountPositive = (() => true)();

  // TODO: Need a V2
  const outputAmount = inputAmount;
  const fromTokenUserBalances = useUserBalanceAmounts(fromTokenSpec);
  const fromTokenBalance = fromTokenUserBalances[fromTokenOption.ecosystemId];
  const outputEcosystemDetail = toTokenSpec.detailsByEcosystem.get(
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
      errors = [...errors, "Invalid amount"];
    } else if (currentInputAmount.isNegative() || currentInputAmount.isZero()) {
      errors = [...errors, "Amount must be greater than 0"];
    } else if (
      fromTokenBalance &&
      currentInputAmount.gt(
        fromTokenBalance.toHuman(fromTokenOption.ecosystemId),
      )
    ) {
      errors = [...errors, "Amount cannot exceed available balance"];
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
        "You're trying to swap >10% of the pool size which may impact the price.",
      );
    } else if (isSmallEthSwap) {
      setConfirmModalDescription(
        "The Ethereum gas fees might be high relative to the swap amount.",
      );
    } else {
      handleSwapAndCatch(false);
    }
    handleSwapAndCatch(false);
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
        "An unexpected error occurred",
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
        "Form error",
        "There was an unexpected error submitting the form. Developers were notified.",
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

  const handleConfirmModalConfirm = async (): Promise<void> => {
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
        placeholder={"Enter amount"}
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
          <EuiCallOut title="Please fix these issues" color="danger">
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
          Swap
        </EuiButton>
      </EuiFormRow>

      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText="Execute swap?"
        cancelText="Cancel"
        confirmText="Swap"
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
