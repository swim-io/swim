import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
} from "@elastic/eui";
import type Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";

import { EcosystemId } from "../config";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  useGetSwapFormErrors,
  useIsLargeSwap,
  usePoolMaths,
  usePools,
  usePrevious,
  useSplTokenAccountsQuery,
  useStepsReducer,
  useSwapFeesEstimationQuery,
  useSwapOutputAmountEstimate,
  useUserBalanceAmounts,
  useUserNativeBalances,
} from "../hooks";
import {
  Amount,
  InteractionType,
  Status,
  getLowBalanceWallets,
  getRequiredPoolsForSwap,
} from "../models";
import { defaultIfError, findOrThrow, isEachNotNull } from "../utils";

import { ConfirmModal } from "./ConfirmModal";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { StepsDisplay } from "./StepsDisplay";
import { NativeTokenIcon } from "./TokenIcon";
import { SwapFormSolanaConnectButton } from "./molecules/SwapFormSolanaConnectButton";
import { TokenAmountInput } from "./molecules/TokenAmountInput";

import "./SwapForm.scss";

export interface SwapFormProps {
  readonly setCurrentInteraction: (id: string) => void;
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapForm = ({
  setCurrentInteraction,
  maxSlippageFraction,
}: SwapFormProps): ReactElement => {
  const { config } = useEnvironment();
  const { notify } = useNotification();
  const { tokens } = config;
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const userNativeBalances = useUserNativeBalances();
  const {
    retryInteraction,
    state: { interaction, steps, status },
    startInteraction,
    mutations,
    isInteractionInProgress,
  } = useStepsReducer();

  const swappableTokenIds = config.pools
    .filter((pool) => !pool.isStakingPool)
    .flatMap((pool) => [...pool.tokenAccounts.keys()])
    // TODO: Remove this if we want to support swimUSD swaps
    .filter((tokenId) =>
      config.pools.every((pool) => pool.lpToken !== tokenId),
    );
  const swappableTokens = swappableTokenIds.map((tokenId) =>
    findOrThrow(config.tokens, (token) => token.id === tokenId),
  );

  const defaultFromTokenId = swappableTokenIds[0];
  const [fromTokenId, setFromTokenId] = useState(defaultFromTokenId);
  const [toTokenId, setToTokenId] = useState(swappableTokenIds[1]);
  const fromToken = findOrThrow(tokens, ({ id }) => id === fromTokenId);
  const toToken = findOrThrow(tokens, ({ id }) => id === toTokenId);
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const requiredPools = getRequiredPoolsForSwap(
    config.pools,
    fromTokenId,
    toTokenId,
  );
  const poolIds = requiredPools.map((pool) => pool.id);
  const pools = usePools(poolIds);
  const isRequiredPoolPaused = pools.some((pool) => pool.isPoolPaused);
  const poolMaths = usePoolMaths(poolIds);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactNode | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;

  const [formInputAmount, setFormInputAmount] = useState("0");
  const [inputAmountErrors, setInputAmountErrors] = useState<readonly string[]>(
    [],
  );

  const prevStatus = usePrevious(status);
  useEffect(() => {
    if (status === Status.Done && prevStatus !== Status.Done) {
      setFormInputAmount("0");
    }
  }, [prevStatus, status, setFormInputAmount]);

  const feesEstimation = useSwapFeesEstimationQuery(fromToken, toToken);

  const inputAmount = defaultIfError(
    () => Amount.fromHumanString(fromToken, formInputAmount),
    Amount.zero(fromToken),
  );

  const isLargeSwap = useIsLargeSwap(fromToken, toToken, inputAmount);
  const isSmallEthSwap =
    fromToken.isStablecoin &&
    [fromToken.nativeEcosystem, toToken.nativeEcosystem].includes(
      EcosystemId.Ethereum,
    ) &&
    inputAmount.toHuman(EcosystemId.Solana).lt(200);

  const getSwapFormErrors = useGetSwapFormErrors(
    fromToken,
    toToken,
    inputAmount,
    maxSlippageFraction,
  );
  const isInputAmountPositive =
    !inputAmount.isNegative() && !inputAmount.isZero();

  const outputAmount = useSwapOutputAmountEstimate(inputAmount, toToken);

  const fromTokenOptions = swappableTokens.map((tokenSpec) => ({
    value: tokenSpec.id,
    inputDisplay: <NativeTokenIcon {...tokenSpec} />,
  }));
  const toTokenOptions = fromTokenOptions.filter(
    ({ value }) => value !== fromTokenId,
  );

  const fromTokenUserBalances = useUserBalanceAmounts(fromToken);
  const fromTokenBalance = fromTokenUserBalances[fromToken.nativeEcosystem];

  const handleInputAmountChange = (currentInputAmount: Amount | null): void => {
    let errors: readonly string[] = [];
    if (currentInputAmount === null) {
      errors = [...errors, "Invalid amount"];
    } else if (currentInputAmount.isNegative() || currentInputAmount.isZero()) {
      errors = [...errors, "Amount must be greater than 0"];
    } else if (fromTokenBalance && currentInputAmount.gt(fromTokenBalance)) {
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
      splTokenAccounts === null ||
      outputAmount === null ||
      maxSlippageFraction === null ||
      !isEachNotNull(poolMaths)
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
    const interactionId = startInteraction(
      {
        type: InteractionType.Swap,
        params: {
          exactInputAmount: inputAmount,
          minimumOutputAmount,
        },
      },
      poolMaths,
    );
    setCurrentInteraction(interactionId);
  };

  useEffect(() => {
    // Eg if the env changes
    setFromTokenId(defaultFromTokenId);
  }, [defaultFromTokenId]);

  useEffect(() => {
    if (!toTokenOptions.find(({ value }) => value === toTokenId)) {
      setToTokenId(toTokenOptions[0].value);
    }
  }, [toTokenId, toTokenOptions]);

  const handleConfirmModalCancel = (): void => {
    setConfirmModalDescription(null);
  };

  const handleConfirmModalConfirm = async (): Promise<void> => {
    setConfirmModalDescription(null);
    handleSwapAndCatch(true);
  };

  return (
    <EuiForm component="form" className="swapForm" onSubmit={handleSubmit}>
      <EuiSpacer />

      <TokenAmountInput
        value={formInputAmount}
        token={fromToken}
        tokenOptionIds={swappableTokenIds}
        placeholder={"Enter amount"}
        disabled={isInteractionInProgress}
        errors={inputAmountErrors}
        onSelectToken={setFromTokenId}
        onChangeValue={(value) => setFormInputAmount(value)}
        onBlur={() => handleInputAmountChange(inputAmount)}
      />

      <EuiSpacer size="m" />
      <div style={{ textAlign: "center" }}>
        <EuiButtonIcon
          iconType={"merge"}
          size="m"
          iconSize="xl"
          onClick={() => {
            setFromTokenId(toTokenId);
            setToTokenId(fromTokenId);
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

      <TokenAmountInput
        value={outputAmount?.toHumanString(toToken.nativeEcosystem) ?? ""}
        token={toToken}
        tokenOptionIds={swappableTokenIds.filter((id) => id !== fromTokenId)}
        placeholder={"Output"}
        disabled={isInteractionInProgress}
        errors={[]}
        onSelectToken={setToTokenId}
      />

      <EuiSpacer />

      <SwapFormSolanaConnectButton
        fromEcosystem={fromToken.nativeEcosystem}
        toEcosystem={toToken.nativeEcosystem}
      />

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

      <EuiSpacer />

      {interaction && steps && (
        <StepsDisplay
          retryInteraction={retryInteraction}
          interaction={interaction}
          steps={steps}
          status={status}
          mutations={mutations}
        />
      )}
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
