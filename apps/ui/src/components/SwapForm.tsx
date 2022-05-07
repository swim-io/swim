import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
} from "@elastic/eui";
import type Decimal from "decimal.js";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { EcosystemId, ecosystems, getNativeTokenDetails } from "../config";
import { useConfig, useNotification } from "../contexts";
import { captureAndWrapException } from "../errors";
import {
  usePoolMaths,
  usePools,
  usePrevious,
  useSplTokenAccountsQuery,
  useStepsReducer,
  useSwapFeesEstimationQuery,
  useUserBalanceAmounts,
  useUserNativeBalances,
  useWallets,
} from "../hooks";
import {
  Amount,
  InteractionType,
  Status,
  getLowBalanceWallets,
  getRequiredPools,
  getTokensByPool,
} from "../models";
import { defaultIfError, findOrThrow, isNotNull } from "../utils";

import { ActionSteps } from "./ActionSteps";
import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { isValidSlippageFraction } from "./SlippageButton";
import { NativeTokenIcon } from "./TokenIcon";

import "./SwapForm.scss";

export interface SwapFormProps {
  readonly poolId: string;
  readonly setCurrentInteraction: (id: string) => void;
  readonly maxSlippageFraction: Decimal | null;
}

export const SwapForm = ({
  setCurrentInteraction,
  maxSlippageFraction,
}: SwapFormProps): ReactElement => {
  const config = useConfig();
  const tokensByPool = getTokensByPool(config);
  const { notify } = useNotification();
  const wallets = useWallets();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const userNativeBalances = useUserNativeBalances();

  const swappableTokenIds = config.pools
    .flatMap((pool) => [...pool.tokenAccounts.keys()])
    .filter((tokenId) =>
      config.pools.every((pool) => pool.lpToken !== tokenId),
    );
  const swappableTokens = swappableTokenIds.map((tokenId) =>
    findOrThrow(config.tokens, (token) => token.id === tokenId),
  );
  const {
    retryInteraction,
    state: { interaction, steps, status },
    startInteraction,
    mutations,
    isInteractionInProgress,
  } = useStepsReducer();
  const pools = usePools(interaction?.poolIds ?? []);
  const isPaused = useMemo(
    () => pools.some((pool) => pool.isPoolPaused),
    [pools],
  );
  const poolMaths = usePoolMaths(interaction?.poolIds ?? []);
  const inputPoolMath = poolMaths[0] ?? null;
  const outputPoolMath = poolMaths[poolMaths.length - 1] ?? null;

  const requiredPools = interaction
    ? getRequiredPools(config.pools, interaction)
    : [];
  const inputPool = requiredPools.find(Boolean) ?? null;
  const outputPool =
    requiredPools.find((_, i) => i === requiredPools.length - 1) ?? null;
  const inputPoolTokens = inputPool ? tokensByPool[inputPool.id] : null;
  const outputPoolTokens = outputPool ? tokensByPool[outputPool.id] : null;

  const [fromTokenId, setFromTokenId] = useState(swappableTokens[0].id);
  const [toTokenId, setToTokenId] = useState(swappableTokens[1].id);
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);
  const fromToken =
    swappableTokens.find(({ id }) => id === fromTokenId) ?? null;
  const toToken = swappableTokens.find(({ id }) => id === toTokenId) ?? null;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactNode>("");

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

  const isLargeSwap = (): boolean => {
    return (
      fromToken !== null &&
      fromToken.isStablecoin &&
      inputAmount !== null &&
      // TODO: Make sure this is sensible (does it need to be a fraction of pool USD value?)
      inputAmount.toHuman(EcosystemId.Solana).gt(100_000)
    );
  };

  const isSmallEthSwap = (): boolean => {
    return (
      fromToken !== null &&
      fromToken.isStablecoin &&
      toToken !== null &&
      [fromToken.nativeEcosystem, toToken.nativeEcosystem].includes(
        EcosystemId.Ethereum,
      ) &&
      inputAmount !== null &&
      inputAmount.toHuman(EcosystemId.Solana).lt(200)
    );
  };

  const inputAmount = useMemo(
    () =>
      defaultIfError(
        () => fromToken && Amount.fromHumanString(fromToken, formInputAmount),
        null,
      ),
    [formInputAmount, fromToken],
  );
  const isInputAmountPositive =
    inputAmount !== null && !inputAmount.isNegative() && !inputAmount.isZero();

  const exactInputAmounts =
    inputAmount !== null && inputPoolTokens !== null
      ? inputPoolTokens.tokens.map((poolToken) =>
          poolToken.id === fromTokenId ? inputAmount : Amount.zero(poolToken),
        )
      : null;

  const outputAmount = useMemo<Amount | null>(() => {
    // TODO: Update this
    return null;
    // if (poolMath === null || exactInputAmounts === null || toToken === null) {
    //   return null;
    // }

    // const outputTokenIndex = poolTokens.findIndex(({ id }) => id === toTokenId);
    // try {
    //   const { stableOutputAmount } = poolMath.swapExactInput(
    //     exactInputAmounts.map((amount) => amount.toHuman(EcosystemId.Solana)),
    //     outputTokenIndex,
    //   );
    //   return Amount.fromHuman(toToken, stableOutputAmount);
    // } catch {
    //   return null;
    // }
  }, []);

  const fromTokenOptions = swappableTokens.map((tokenSpec) => ({
    value: tokenSpec.id,
    inputDisplay: <NativeTokenIcon {...tokenSpec} />,
  }));
  const toTokenOptions = fromTokenOptions.filter(
    ({ value }) => value !== fromTokenId,
  );

  const fromTokenUserBalances = useUserBalanceAmounts(fromToken);
  const fromTokenBalance = fromToken
    ? fromTokenUserBalances[fromToken.nativeEcosystem]
    : null;
  const toTokenUserBalances = useUserBalanceAmounts(toToken);
  const toTokenBalance = toToken
    ? toTokenUserBalances[toToken.nativeEcosystem]
    : null;

  const fromTokenNativeDetails = fromToken
    ? getNativeTokenDetails(fromToken)
    : null;

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
    if (fromTokenBalancePrimitive && !inputAmount?.isZero()) {
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
      setIsConfirmModalVisible(true);
      setConfirmModalDescription(
        <LowBalanceDescription lowBalanceWallets={lowBalanceWallets} />,
      );
    } else if (isLargeSwap()) {
      setIsConfirmModalVisible(true);
      setConfirmModalDescription(
        "You're trying to swap >10% of the pool size which may impact the price.",
      );
    } else if (isSmallEthSwap()) {
      setIsConfirmModalVisible(true);
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
    // reset everything
    setFormErrors([]);
    let errors: readonly string[] = [];

    // Require connected Solana wallet
    if (!wallets.solana.connected) {
      errors = [...errors, "Connect Solana wallet"];
    }

    if (!fromToken) {
      errors = [...errors, "Select a source token"];
    }

    if (!toToken) {
      errors = [...errors, "Select a destination token"];
    }

    // Require source token to have a connected wallet
    if (
      fromToken &&
      fromToken.nativeEcosystem !== EcosystemId.Solana &&
      !wallets[fromToken.nativeEcosystem].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ecosystems[fromToken.nativeEcosystem].displayName} wallet`,
      ];
    }

    // Require destination token to have a connected wallet
    if (
      toToken &&
      toToken.nativeEcosystem !== EcosystemId.Solana &&
      !wallets[toToken.nativeEcosystem].connected
    ) {
      errors = [
        ...errors,
        `Connect ${ecosystems[toToken.nativeEcosystem].displayName} wallet`,
      ];
    }

    // Require non-zero native balances
    const requiredEcosystems = new Set(
      [
        EcosystemId.Solana,
        fromToken ? fromToken.nativeEcosystem : null,
        toToken ? toToken.nativeEcosystem : null,
      ].filter(isNotNull),
    );
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${ecosystems[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
        ];
      }
    });

    // Need some SOL for network fee
    if (
      userNativeBalances[EcosystemId.Solana].greaterThan(0) &&
      userNativeBalances[EcosystemId.Solana].lessThan(0.01)
    ) {
      errors = [
        ...errors,
        `Low SOL in Solana wallet. You will need up to ~0.01 SOL to pay for network fees.`,
      ];
    }

    // Require enough user balances
    if (inputAmount && fromTokenBalance && inputAmount.gt(fromTokenBalance)) {
      errors = [...errors, "Insufficient funds"];
    }

    if (
      inputAmount === null ||
      inputAmount.isZero() ||
      exactInputAmounts === null
    ) {
      errors = [...errors, "Provide a valid amount"];
    }

    if (isLargeSwap() && !allowLargeSwap) {
      // If not allowed, limit swap size to 10% of pool supply
      errors = [...errors, "Swap size must be less than 10% of pool supply"];
    }

    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, "Provide a valid max slippage setting"];
    }

    if (errors.length > 0) {
      setFormErrors([...errors]);
      return;
    }

    // These are just for type safety and should in theory not happen
    if (
      fromToken === null ||
      toToken === null ||
      splTokenAccounts === null ||
      exactInputAmounts === null ||
      outputAmount === null ||
      maxSlippageFraction === null
    ) {
      notify(
        "Form error",
        "There was an unexpected error submitting the form. Developers were notified.",
        "error",
      );
      return;
    }

    const outputTokenIndex =
      outputPoolTokens !== null
        ? outputPoolTokens.tokens.findIndex(({ id }) => id === toToken.id)
        : -1;
    if (outputTokenIndex === -1) {
      throw new Error("Output token not found");
    }

    const minimumOutputAmount = outputAmount.sub(
      outputAmount.mul(maxSlippageFraction),
    );
    const interactionId = startInteraction({
      type: InteractionType.Swap,
      params: {
        exactInputAmounts: exactInputAmounts.reduce(
          (amountsByTokenId, amount) =>
            amountsByTokenId.set(amount.tokenId, amount),
          new Map(),
        ),
        outputTokenId: toToken.id,
        minimumOutputAmount,
      },
    });
    setCurrentInteraction(interactionId);
  };

  useEffect(() => {
    // Eg if the env changes
    if (!fromToken) {
      setFromTokenId(swappableTokenIds[0]);
    }
  }, [fromToken, swappableTokenIds]);

  useEffect(() => {
    if (!toTokenOptions.find(({ value }) => value === toTokenId)) {
      setToTokenId(toTokenOptions[0].value);
    }
  }, [toTokenId, toTokenOptions]);

  const handleConfirmModalCancel = (): void => {
    setIsConfirmModalVisible(false);
  };

  const handleConfirmModalConfirm = async (): Promise<void> => {
    setIsConfirmModalVisible(false);
    handleSwapAndCatch(true);
  };

  return (
    <EuiForm component="form" className="swapForm" onSubmit={handleSubmit}>
      <EuiSpacer />

      <EuiFlexGroup>
        <EuiFlexItem grow={2}>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiSuperSelect
              name="fromToken"
              options={fromTokenOptions}
              valueOfSelected={fromTokenId}
              onChange={setFromTokenId}
              itemLayoutAlign="top"
              disabled={isInteractionInProgress}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            labelType="legend"
            labelAppend={
              <EuiText size="xs">
                <span>Balance:</span>{" "}
                {fromTokenBalance !== null && fromToken !== null ? (
                  <EuiLink
                    onClick={() => {
                      setFormInputAmount(
                        fromTokenBalance.toHumanString(
                          fromToken.nativeEcosystem,
                        ),
                      );
                      handleInputAmountChange(fromTokenBalance);
                    }}
                  >
                    {fromTokenBalance.toFormattedHumanString(
                      fromToken.nativeEcosystem,
                    )}
                  </EuiLink>
                ) : (
                  "-"
                )}
              </EuiText>
            }
            isInvalid={inputAmountErrors.length > 0}
            error={inputAmountErrors}
          >
            <EuiFieldNumber
              name="inputAmount"
              placeholder="Enter amount"
              value={formInputAmount}
              step={
                fromTokenNativeDetails
                  ? 10 ** -fromTokenNativeDetails.decimals
                  : 0
              }
              min={0}
              onChange={(e) => {
                setFormInputAmount(e.target.value);
              }}
              disabled={isInteractionInProgress}
              onBlur={() => {
                handleInputAmountChange(inputAmount);
              }}
              isInvalid={inputAmountErrors.length > 0}
            />
          </EuiFormRow>
        </EuiFlexItem>
        {fromToken && (
          <EuiFlexItem style={{ minWidth: "180px" }}>
            <EuiFormRow hasEmptyLabelSpace>
              <ConnectButton
                ecosystemId={fromToken.nativeEcosystem}
                fullWidth
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

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

      <EuiFlexGroup>
        <EuiFlexItem grow={2}>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiSuperSelect
              name="toToken"
              options={toTokenOptions}
              valueOfSelected={toTokenId}
              onChange={setToTokenId}
              itemLayoutAlign="top"
              disabled={isInteractionInProgress}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            labelType="legend"
            labelAppend={
              <EuiText size="xs">
                <span>Balance:</span>{" "}
                <span>
                  {toTokenBalance !== null && toToken !== null
                    ? toTokenBalance.toFormattedHumanString(
                        toToken.nativeEcosystem,
                      )
                    : "-"}
                </span>
              </EuiText>
            }
          >
            <EuiFieldText
              name="outputAmount"
              value={
                toToken && outputAmount
                  ? outputAmount.toFormattedHumanString(toToken.nativeEcosystem)
                  : ""
              }
              controlOnly
              placeholder="Output"
              readOnly
            />
          </EuiFormRow>
        </EuiFlexItem>
        {toToken && (
          <EuiFlexItem style={{ minWidth: "180px" }}>
            <EuiFormRow hasEmptyLabelSpace>
              <ConnectButton ecosystemId={toToken.nativeEcosystem} fullWidth />
            </EuiFormRow>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiSpacer />

      {/* If a swap to/from Ethereum/BSC is desired, we still need a Solana wallet */}
      {fromToken &&
        toToken &&
        ![fromToken.nativeEcosystem, toToken.nativeEcosystem].includes(
          EcosystemId.Solana,
        ) &&
        !wallets.solana.connected && (
          <>
            <EuiFormRow
              fullWidth
              helpText="This swap will route through Solana, so you need to connect a Solana wallet with SOL to pay for transaction fees."
            >
              <ConnectButton ecosystemId={EcosystemId.Solana} fullWidth />
            </EuiFormRow>
            <EuiSpacer />
          </>
        )}
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

      <PoolPausedAlert isVisible={isPaused} />

      <EuiFormRow fullWidth>
        <EuiButton
          type="submit"
          fullWidth
          fill
          isLoading={isInteractionInProgress}
          isDisabled={isPaused || isSubmitted}
        >
          Swap
        </EuiButton>
      </EuiFormRow>

      <EuiSpacer />

      {interaction && steps && (
        <ActionSteps
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
