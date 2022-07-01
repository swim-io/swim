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
import { useCallback, useEffect, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../config";
import { EcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  useGetSwapFormErrors,
  useIsLargeSwap,
  usePoolMaths,
  usePools,
  useSplTokenAccountsQuery,
  useSwapFeesEstimationQuery,
  useSwapOutputAmountEstimate,
  useUserBalanceAmounts,
  useUserNativeBalances,
} from "../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteraction,
} from "../hooks/interaction";
import {
  Amount,
  InteractionType,
  getLowBalanceWallets,
  getRequiredPoolsForSwap,
} from "../models";
import { defaultIfError, findOrThrow, isEachNotNull } from "../utils";

import { ConfirmModal } from "./ConfirmModal";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { SwapFormSolanaConnectButton } from "./molecules/SwapFormSolanaConnectButton";
import { TokenAmountInput } from "./molecules/TokenAmountInput";

import "./SwapForm.scss";

const swimUsdRegExp = /-solana-lp-hexapool$/;
// TODO: Make this check more robust
const isSwimUsdPool = (pool: PoolSpec): boolean =>
  [pool.lpToken, ...pool.tokenAccounts.keys()].some((key) =>
    swimUsdRegExp.test(key),
  );

export interface SwapFormProps {
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapForm = ({
  maxSlippageFraction,
}: SwapFormProps): ReactElement => {
  const config = useEnvironment(selectConfig, shallow);
  const { notify } = useNotification();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const userNativeBalances = useUserNativeBalances();
  const startNewInteraction = useStartNewInteraction();
  const isInteractionInProgress = useHasActiveInteraction();
  const {
    fromToken,
    toToken,
    setFromTokenId,
    setToTokenId,
    fromTokenOptionsIds,
    toTokenOptionsIds,
  } = useSwapFormTokens(config.pools, config.tokens);
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

  const [formInputAmount, setFormInputAmount] = useState("0");
  const [inputAmountErrors, setInputAmountErrors] = useState<readonly string[]>(
    [],
  );

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

  const handleConfirmModalConfirm = async (): Promise<void> => {
    setConfirmModalDescription(null);
    handleSwapAndCatch(true);
  };
  const isStableSwap = requiredPools.every((pool) => pool.isStableSwap);
  return (
    <EuiForm component="form" className="swapForm" onSubmit={handleSubmit}>
      <EuiSpacer />

      <TokenAmountInput
        value={formInputAmount}
        token={fromToken}
        tokenOptionIds={fromTokenOptionsIds}
        placeholder={"Enter amount"}
        disabled={isInteractionInProgress}
        errors={inputAmountErrors}
        onSelectToken={setFromTokenId}
        onChangeValue={(value) => setFormInputAmount(value)}
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
            setFromTokenId(toToken.id);
            setToTokenId(fromToken.id);
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
        tokenOptionIds={toTokenOptionsIds}
        placeholder={"Output"}
        disabled={isInteractionInProgress}
        errors={[]}
        onSelectToken={setToTokenId}
        // Never show constant swap on "To Form".
        showConstantSwapTip={false}
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

type SwapFormTokens = {
  readonly fromToken: TokenSpec;
  readonly toToken: TokenSpec;
  readonly setFromTokenId: (fromTokenId: string) => void;
  readonly setToTokenId: (toTokenId: string) => void;
  readonly fromTokenOptionsIds: readonly string[];
  readonly toTokenOptionsIds: readonly string[];
};

const useSwapFormTokens = (
  pools: readonly PoolSpec[],
  tokens: readonly TokenSpec[],
): SwapFormTokens => {
  const fromTokenOptionsIds = useMemo(
    () =>
      pools
        .filter((pool) => !pool.isStakingPool)
        .flatMap((pool) => [...pool.tokenAccounts.keys()])
        // TODO: Remove this if we want to support swimUSD swaps
        .filter((tokenId) => pools.every((pool) => pool.lpToken !== tokenId)),
    [pools],
  );

  // TODO: Handle swimUSD as a swappable token
  const getOutputTokens = useCallback(
    (fromTokenId: string): readonly string[] => {
      const inputPool = findOrThrow(pools, (pool) =>
        pool.tokenAccounts.has(fromTokenId),
      );
      const connectedTokens = isSwimUsdPool(inputPool)
        ? pools
            .filter(isSwimUsdPool)
            .flatMap((pool) => [...pool.tokenAccounts.keys()])
        : [...inputPool.tokenAccounts.keys()];
      return connectedTokens.filter(
        (tokenId) => tokenId !== fromTokenId && !swimUsdRegExp.test(tokenId),
      );
    },
    [pools],
  );

  const getDefaultFromTokenId = useCallback(
    () => fromTokenOptionsIds[0],
    [fromTokenOptionsIds],
  );

  const [fromTokenId, setFromTokenId] = useState(getDefaultFromTokenId);
  const [toTokenId, setToTokenId] = useState(
    () => getOutputTokens(fromTokenId)[0],
  );

  const fromToken =
    tokens.find(({ id }) => id === fromTokenId) ||
    tokens.find(({ id }) => id === getDefaultFromTokenId());

  if (!fromToken) throw new Error("Can't figure out fromToken");

  const toToken =
    tokens.find(({ id }) => id === toTokenId) ||
    tokens.find(({ id }) => id === getOutputTokens(fromToken.id)[0]);

  if (!toToken) throw new Error("Can't figure out toToken");

  useEffect(() => {
    if (fromToken.id !== fromTokenId) {
      setFromTokenId(getDefaultFromTokenId());
      setToTokenId(getOutputTokens(fromToken.id)[0]);
    }
  }, [getDefaultFromTokenId, getOutputTokens, fromToken.id, fromTokenId]);

  return {
    fromToken,
    toToken,
    setFromTokenId,
    setToTokenId,
    fromTokenOptionsIds,
    toTokenOptionsIds: getOutputTokens(fromToken.id),
  };
};
