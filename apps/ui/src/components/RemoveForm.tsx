import type { EuiRadioGroupOption, EuiSelectOption } from "@elastic/eui";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiPanel,
  EuiRadioGroup,
  EuiRange,
  EuiSelect,
  EuiSpacer,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../config";
import { ECOSYSTEMS, EcosystemId } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  usePool,
  usePoolMath,
  useRemoveFeesEstimationQuery,
  useSplTokenAccountsQuery,
  useUserLpBalances,
  useUserNativeBalances,
  useWallets,
} from "../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteraction,
} from "../hooks/interaction";
import {
  Amount,
  INTERACTION_GROUP_REMOVE,
  InteractionType,
  getLowBalanceWallets,
  isValidSlippageFraction,
} from "../models";
import type { ReadonlyRecord } from "../utils";
import {
  defaultIfError,
  findOrThrow,
  isEachNotNull,
  isNotNull,
} from "../utils";

import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { RecentInteractions } from "./RecentInteractions";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { TokenIcon } from "./TokenIcon";

export const enum RemoveMethod {
  Uniform = "uniform",
  ExactBurn = "exactBurn",
  ExactOutput = "exactOutput",
}

export interface RemoveFormProps {
  readonly poolSpec: PoolSpec;
  readonly maxSlippageFraction: Decimal | null;
}

export const RemoveForm = ({
  poolSpec,
  maxSlippageFraction,
}: RemoveFormProps): ReactElement => {
  const config = useEnvironment(selectConfig, shallow);
  const {
    tokens: poolTokens,
    lpToken,
    poolLpMint,
    userLpTokenAccount,
  } = usePool(poolSpec.id);
  const poolMath = usePoolMath(poolSpec.id);
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const startNewInteraction = useStartNewInteraction(() => {
    if (method === RemoveMethod.ExactOutput) {
      setFormOutputAmounts(formOutputAmounts.map(() => "0"));
    }
  });
  const isInteractionInProgress = useHasActiveInteraction();
  const userLpBalances = useUserLpBalances(lpToken, userLpTokenAccount);
  const wallets = useWallets();
  const userNativeBalances = useUserNativeBalances();

  const [lpTokenSourceEcosystem, setLpTokenSourceEcosystem] = useState(
    EcosystemId.Solana,
  );
  const [method, setMethod] = useState(RemoveMethod.ExactBurn);
  const [outputToken, setOutputToken] = useState(poolSpec.tokens[0]);
  const [burnPercentage, setBurnPercentage] = useState(0);

  const userLpBalance = userLpBalances[lpTokenSourceEcosystem];
  const exactBurnAmount = userLpBalance
    ? userLpBalance.mul(new Decimal(burnPercentage / 100))
    : Amount.zero(lpToken);
  const poolTokensByEcosystem: ReadonlyRecord<
    EcosystemId,
    readonly TokenSpec[]
  > = poolTokens.reduce(
    (accumulator, tokenSpec) => ({
      ...accumulator,
      [tokenSpec.nativeEcosystem]: [
        ...accumulator[tokenSpec.nativeEcosystem],
        tokenSpec,
      ],
    }),
    {
      [EcosystemId.Solana]: [],
      [EcosystemId.Ethereum]: [],
      [EcosystemId.Bnb]: [],
      [EcosystemId.Avalanche]: [],
      [EcosystemId.Polygon]: [],
      [EcosystemId.Aurora]: [],
      [EcosystemId.Fantom]: [],
      [EcosystemId.Karura]: [],
      [EcosystemId.Acala]: [],
    },
  );

  const { notify } = useNotification();
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const [outputAmountErrors, setOutputAmountErrors] = useState(
    new Map(
      poolTokens.map((token): readonly [string, readonly string[]] => [
        token.id,
        [],
      ]),
    ),
  );

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactElement | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;
  const handleConfirmModalCancel = (): void => setConfirmModalDescription(null);
  const handleConfirmModalConfirm = (): void => {
    setConfirmModalDescription(null);
    handleSubmitAndCatch();
  };

  const poolLpAmount = useMemo(
    () =>
      poolLpMint
        ? Amount.fromAtomicString(
            lpToken,
            poolLpMint.supply.toString(),
            EcosystemId.Solana,
          )
        : null,
    [poolLpMint, lpToken],
  );

  const userHasAllLpTokens = useMemo(
    () =>
      poolLpAmount !== null &&
      userLpBalance !== null &&
      poolLpAmount.equals(userLpBalance),
    [poolLpAmount, userLpBalance],
  );

  // calculate estimated output amounts
  useEffect(
    () => {
      if (
        method === RemoveMethod.ExactOutput ||
        poolLpAmount === null ||
        userLpBalance === null ||
        poolMath === null
      ) {
        return;
      }

      const removeUniformAmounts =
        method === RemoveMethod.Uniform && burnPercentage > 0
          ? poolMath.removeUniform(exactBurnAmount.toHuman(EcosystemId.Solana))
          : null;

      // eslint-disable-next-line functional/prefer-readonly-type
      const newFormOutputAmounts: string[] = [];
      for (const [tokenIndex, tokenSpec] of poolTokens.entries()) {
        let estimatedOutputAmountDecimal = new Decimal(0);

        if (method === RemoveMethod.Uniform && removeUniformAmounts !== null) {
          estimatedOutputAmountDecimal = removeUniformAmounts[tokenIndex];
        } else if (
          method === RemoveMethod.ExactBurn &&
          burnPercentage > 0 &&
          outputToken === tokenSpec.id
        ) {
          const { stableOutputAmount } = poolMath.removeExactBurn(
            exactBurnAmount.toHuman(EcosystemId.Solana),
            tokenIndex,
          );
          estimatedOutputAmountDecimal = stableOutputAmount;
        }

        const estimatedOutputAmount = Amount.fromHuman(
          tokenSpec,
          estimatedOutputAmountDecimal,
        );

        // eslint-disable-next-line functional/immutable-data
        newFormOutputAmounts.push(
          // toHumanString because thousands separators would mess up the conversion
          estimatedOutputAmount.toHumanString(tokenSpec.nativeEcosystem),
        );
      }

      setFormOutputAmounts(newFormOutputAmounts);
    },
    // We specifically only want to update the estimated amounts on user action.
    // If they auto-updated (e.g. on balance change), they could change right before
    // the user clicks submit, rendering their max slippage setting useless.

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, burnPercentage, lpTokenSourceEcosystem, outputToken],
  );

  const [formOutputAmounts, setFormOutputAmounts] = useState(
    poolTokens.map(() => "0"),
  );
  const formOutputAmountsById = new Map(
    poolTokens.map(({ id }, i) => [id, formOutputAmounts[i]]),
  );
  const outputAmounts: readonly (Amount | null)[] = useMemo(
    () =>
      formOutputAmounts.map((amount, i) =>
        defaultIfError(
          () => Amount.fromHumanString(poolTokens[i], amount),
          null,
        ),
      ),
    [formOutputAmounts, poolTokens],
  );

  const feesEstimation = useRemoveFeesEstimationQuery(
    outputAmounts,
    lpTokenSourceEcosystem,
  );

  const hasPositiveOutputAmount = outputAmounts.some(
    (amount) => amount && !amount.isZero(),
  );

  const outputAmountsById = new Map(
    poolTokens.map(({ id }, i) => [id, outputAmounts[i]]),
  );

  // calculate estimated LP tokens needed when exact outputs change
  const estimatedLpInput = useMemo(() => {
    if (
      method !== RemoveMethod.ExactOutput ||
      !poolMath ||
      !isEachNotNull(outputAmounts)
    ) {
      return null;
    }

    return defaultIfError(() => {
      if (!isEachNotNull(outputAmounts)) {
        return null;
      }
      const { lpInputAmount } = poolMath.removeExactOutput(
        outputAmounts.map((amount) => amount.toHuman(EcosystemId.Solana)),
      );
      return Amount.fromHuman(lpToken, lpInputAmount);
    }, null);
  }, [outputAmounts, poolMath, method, lpToken]);

  const maximumBurnAmount =
    estimatedLpInput && maxSlippageFraction
      ? estimatedLpInput.add(estimatedLpInput.mul(maxSlippageFraction))
      : null;

  const onOutputAmountBlur = (
    rawAmount: string,
    tokenSpec: TokenSpec,
  ): void => {
    const outputAmount = outputAmountsById.get(tokenSpec.id) ?? null;
    let errors: readonly string[] = [];

    // TODO: add maximum amount check

    if (outputAmount === null) {
      const onChange = createOnChange(tokenSpec);
      onChange("0");
    } else if (outputAmount.isNegative()) {
      errors = ["Amount must be greater than or equal to zero"];
    }

    setOutputAmountErrors(
      new Map([...outputAmountErrors, [tokenSpec.id, errors]]),
    );
  };

  const lpSourceEcosystemOptions: readonly EuiRadioGroupOption[] = [
    ...lpToken.detailsByEcosystem.keys(),
  ].map((ecosystemId) => {
    const ecosystem = ECOSYSTEMS[ecosystemId];
    const lpBalance = userLpBalances[ecosystemId];
    const lpBalanceSuffix = lpBalance && (
      <>
        &#8200;(
        {lpBalance.toFormattedHumanString(lpToken.nativeEcosystem)})
      </>
    );
    return {
      id: ecosystemId,
      label: (
        <>
          <EuiIcon type={ecosystem.logo} />
          &nbsp;{ecosystem.displayName}
          {lpBalanceSuffix}
        </>
      ),
    };
  });

  const methodOptions: readonly EuiRadioGroupOption[] =
    poolTokens.length > 1
      ? [
          { id: RemoveMethod.ExactBurn, label: "To a single token" },
          { id: RemoveMethod.Uniform, label: "Proportionally to all tokens" },
          { id: RemoveMethod.ExactOutput, label: "Enter exact output amounts" },
        ]
      : [
          { id: RemoveMethod.ExactBurn, label: "Burn exact amount" },
          { id: RemoveMethod.ExactOutput, label: "Enter exact output amount" },
        ];

  const outputTokenOptions: readonly EuiSelectOption[] = poolSpec.tokens.map(
    (id) => {
      const tokenSpec = findOrThrow(config.tokens, (token) => token.id === id);
      return {
        value: id,
        text: `${tokenSpec.displayName} (${
          ECOSYSTEMS[tokenSpec.nativeEcosystem].displayName
        })`,
      };
    },
  );

  const createOnChange = (tokenSpec: TokenSpec) => (value: string) => {
    const i = poolTokens.findIndex(({ id }) => id === tokenSpec.id);
    if (i !== -1) {
      setFormOutputAmounts([
        ...formOutputAmounts.slice(0, i),
        value,
        ...formOutputAmounts.slice(i + 1),
      ]);
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const lowBalanceWallets = getLowBalanceWallets(
      feesEstimation,
      userNativeBalances,
    );
    if (lowBalanceWallets.length > 0) {
      setConfirmModalDescription(
        <LowBalanceDescription lowBalanceWallets={lowBalanceWallets} />,
      );
      return;
    }

    if (isSubmitted) {
      return;
    }
    try {
      setIsSubmitted(true);
      handleSubmitAndCatch();
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

  const handleSubmitAndCatch = (): void => {
    // reset everything
    setFormErrors([]);
    let errors: readonly string[] = [];

    // pool errors
    if (!poolLpAmount) {
      notify("Pool error", "Could not fetch pool LP amount", "error");
      return;
    }

    const requiredEcosystems = new Set(
      [
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...poolTokens.map((tokenSpec, i) => {
          const outputAmount = outputAmounts[i];
          return outputAmount !== null && !outputAmount.isZero()
            ? tokenSpec.nativeEcosystem
            : null;
        }),
      ].filter(isNotNull),
    );

    // Require connected wallets
    requiredEcosystems.forEach((ecosystem) => {
      if (!wallets[ecosystem].connected) {
        errors = [
          ...errors,
          `Connect ${ECOSYSTEMS[ecosystem].displayName} wallet`,
        ];
      }
    });

    // Require non-zero native balances
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${
            ECOSYSTEMS[EcosystemId.Solana].displayName
          } wallet. You will need some funds to pay for transaction fees.`,
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

    // Require valid slippage setting
    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, "Provide a valid max slippage setting"];
    }

    // Require LP tokens
    if (
      userLpBalances[lpTokenSourceEcosystem] === null ||
      userLpBalances[lpTokenSourceEcosystem]?.isZero()
    ) {
      errors = [
        ...errors,
        `You do not have any LP tokens on ${ECOSYSTEMS[lpTokenSourceEcosystem].displayName}`,
      ];
    }

    // Require enough LP tokens
    if (method === RemoveMethod.ExactOutput) {
      if (
        estimatedLpInput !== null &&
        userLpBalance !== null &&
        estimatedLpInput.gt(userLpBalance)
      ) {
        errors = [...errors, "You do not have enough LP tokens"];
      }

      // Require at least one output amount
      if (outputAmounts.every((amount) => amount === null || amount.isZero())) {
        errors = [...errors, "Enter at least one output amount"];
      }
    }

    // Require valid burn percentage
    if (method !== RemoveMethod.ExactOutput && burnPercentage === 0) {
      errors = [...errors, "Set the burn percentage to greater than zero"];
    }

    if (errors.length > 0) {
      setFormErrors([...errors]);
      return;
    }

    // Redundant checks for type safety
    const outputTokenIndex = poolTokens.findIndex(
      ({ id }) => id === outputToken,
    );

    if (
      !splTokenAccounts ||
      maxSlippageFraction === null ||
      !isEachNotNull(outputAmounts) ||
      (method === RemoveMethod.ExactBurn && outputTokenIndex === -1) ||
      poolMath === null
    ) {
      notify(
        "Form error",
        "There was an unexpected error submitting the form. Developers were notified.",
        "error",
      );
      return;
    }

    switch (method) {
      case RemoveMethod.Uniform: {
        const minimumOutputAmounts = outputAmounts.map((amount) =>
          amount.sub(amount.mul(maxSlippageFraction)),
        );
        startNewInteraction({
          type: InteractionType.RemoveUniform,
          poolId: poolSpec.id,
          params: {
            exactBurnAmount,
            minimumOutputAmounts,
          },
          lpTokenSourceEcosystem,
        });
        return;
      }
      case RemoveMethod.ExactBurn: {
        const outputAmount = outputAmounts[outputTokenIndex];
        const minimumOutputAmount = outputAmount.sub(
          outputAmount.mul(maxSlippageFraction),
        );
        startNewInteraction({
          type: InteractionType.RemoveExactBurn,
          poolId: poolSpec.id,
          params: {
            exactBurnAmount,
            minimumOutputAmount,
          },
          lpTokenSourceEcosystem,
        });
        return;
      }
      case RemoveMethod.ExactOutput: {
        if (maximumBurnAmount === null) {
          throw new Error("LP token estimate not available");
        }
        startNewInteraction({
          type: InteractionType.RemoveExactOutput,
          poolId: poolSpec.id,
          params: {
            maximumBurnAmount,
            exactOutputAmounts: outputAmounts,
          },
          lpTokenSourceEcosystem,
        });
        return;
      }
      default:
        return;
    }
  };

  const maximumLpBurnLabel = poolSpec.isStakingPool
    ? `Maximum required ${lpToken.symbol} tokens: `
    : `Maximum required LP tokens (${lpToken.symbol}): `;

  return (
    <EuiForm component="form" onSubmit={handleFormSubmit}>
      <EuiSpacer size="m" />
      <EuiFormRow
        label={`Use LP tokens (${lpToken.symbol}) from`}
        helpText={
          lpTokenSourceEcosystem === EcosystemId.Solana ||
          method !== RemoveMethod.ExactOutput
            ? ""
            : `The estimated LP tokens needed (including slippage) will be transferred from ${ECOSYSTEMS[lpTokenSourceEcosystem].displayName} to Solana, and any unused tokens will remain in your LP token account on Solana.`
        }
      >
        <EuiRadioGroup
          name="selectLpTargetProtocol"
          options={[...lpSourceEcosystemOptions]}
          idSelected={lpTokenSourceEcosystem}
          onChange={(id) => {
            setLpTokenSourceEcosystem(id as EcosystemId);
          }}
        />
      </EuiFormRow>

      <EuiSpacer size="l" />

      <EuiFormRow label="Remove method">
        <EuiRadioGroup
          name="method"
          options={[...methodOptions]}
          idSelected={method}
          onChange={(newMethod) => {
            if (
              newMethod === RemoveMethod.ExactBurn &&
              burnPercentage === 100 &&
              userHasAllLpTokens
            ) {
              notify(
                "Invalid action",
                "You are the only LP token holder. Please use the proportional remove method or select a lower burn percentage.",
                "error",
              );
              return;
            }
            setMethod(newMethod as RemoveMethod);
          }}
        />
      </EuiFormRow>
      <EuiSpacer />
      {method === RemoveMethod.ExactOutput ? (
        <>
          <span>{maximumLpBurnLabel}</span>
          <span>
            {maximumBurnAmount !== null
              ? maximumBurnAmount.toFormattedHumanString(lpTokenSourceEcosystem)
              : "-"}
          </span>
        </>
      ) : (
        <EuiFormRow
          label="Burn percentage"
          helpText={
            method === RemoveMethod.ExactBurn &&
            userHasAllLpTokens &&
            burnPercentage === 99
              ? "You are the last person to remove. Please use the proportional remove method."
              : ""
          }
        >
          <EuiRange
            name="burnPercentage"
            min={0}
            // If user is the last one to remove from the pool, it is not possible for them
            // to remove 100% LP tokens to a single token.
            max={
              method === RemoveMethod.ExactBurn && userHasAllLpTokens ? 99 : 100
            }
            step={1}
            value={burnPercentage}
            onChange={(e) => {
              setBurnPercentage(parseInt(e.currentTarget.value));
            }}
            showValue
            valueAppend={"%"}
            fullWidth
            disabled={!wallets[lpTokenSourceEcosystem].connected}
          />
        </EuiFormRow>
      )}
      <EuiSpacer />
      {method === RemoveMethod.ExactBurn && poolTokens.length > 1 && (
        <>
          <EuiFormRow label="Output token">
            <EuiSelect
              name="outputToken"
              fullWidth
              options={[...outputTokenOptions]}
              value={outputToken}
              onChange={(e) => {
                setOutputToken(e.target.value);
              }}
            />
          </EuiFormRow>
          <EuiSpacer />
        </>
      )}

      {Object.entries(poolTokensByEcosystem)
        .filter(([_, ecosystemTokens]) => ecosystemTokens.length > 0)
        .map(([ecosystemId, ecosystemTokens]) => (
          <EuiPanel
            key={ecosystemId}
            hasShadow={false}
            hasBorder={true}
            paddingSize="s"
            style={{ marginBottom: "24px" }}
          >
            <ConnectButton ecosystemId={ecosystemId as EcosystemId} fullWidth />
            <EuiSpacer size="m" />
            {ecosystemTokens.map((tokenSpec) => {
              const onChange = createOnChange(tokenSpec);
              return (
                <EuiFormRow
                  fullWidth
                  key={tokenSpec.id}
                  isInvalid={
                    (outputAmountErrors.get(tokenSpec.id) ?? []).length > 0
                  }
                  error={outputAmountErrors.get(tokenSpec.id)}
                >
                  <EuiFieldText
                    placeholder="Enter amount"
                    name={tokenSpec.id}
                    value={
                      method === RemoveMethod.ExactOutput
                        ? formOutputAmountsById.get(tokenSpec.id) ?? "0"
                        : outputAmountsById
                            .get(tokenSpec.id)
                            ?.toFormattedHumanString(
                              tokenSpec.nativeEcosystem,
                            ) ?? "0"
                    }
                    fullWidth
                    disabled={
                      !wallets[ecosystemId as EcosystemId].connected ||
                      isInteractionInProgress
                    }
                    readOnly={[
                      RemoveMethod.Uniform,
                      RemoveMethod.ExactBurn,
                    ].includes(method)}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={(e) => {
                      onOutputAmountBlur(e.target.value, tokenSpec);
                    }}
                    isInvalid={
                      (outputAmountErrors.get(tokenSpec.id) ?? []).length > 0
                    }
                    prepend={
                      <EuiButtonEmpty size="xs">
                        <TokenIcon {...tokenSpec} />
                      </EuiButtonEmpty>
                    }
                  />
                </EuiFormRow>
              );
            })}
          </EuiPanel>
        ))}

      <EuiSpacer size="m" />
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

      {hasPositiveOutputAmount && (
        <EstimatedTxFeesCallout feesEstimation={feesEstimation} />
      )}

      <EuiButton
        type="submit"
        fullWidth
        fill
        isLoading={isInteractionInProgress}
        isDisabled={isSubmitted}
      >
        {poolSpec.isStakingPool ? "Unstake" : "Remove"}
      </EuiButton>
      <EuiSpacer />

      <RecentInteractions
        title={"Recent removes"}
        interactionTypes={INTERACTION_GROUP_REMOVE}
      />

      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText="Execute Remove?"
        cancelText="Cancel"
        confirmText="Remove"
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
