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
import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";
import {
  defaultIfError,
  findOrThrow,
  isEachNotNull,
  isNotNull,
} from "@swim-io/utils";
import Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import type { EcosystemId, PoolSpec, TokenConfig } from "../config";
import { ECOSYSTEMS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  usePool,
  usePoolMath,
  useRemoveFeesEstimationQuery,
  useRemoveFeesEstimationQueryV2,
  useSplTokenAccountsQuery,
  useUserLpBalances,
  useUserNativeBalances,
  useWallets,
} from "../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteraction,
  useStartNewInteractionV2,
} from "../hooks/interaction";
import {
  Amount,
  INTERACTION_GROUP_REMOVE,
  InteractionType,
  getLowBalanceWallets,
  isEvmPoolState,
  isValidSlippageFraction,
} from "../models";

import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { RecentInteractions } from "./RecentInteractions";
import { RecentInteractionsV2 } from "./RecentInteractionsV2";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { TokenIcon } from "./TokenIcon";

const enum RemoveMethod {
  Uniform = "uniform",
  ExactBurn = "exactBurn",
  ExactOutput = "exactOutput",
}

interface Props {
  readonly poolSpec: PoolSpec;
  readonly maxSlippageFraction: Decimal | null;
}

export const RemoveForm = ({
  poolSpec,
  maxSlippageFraction,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const config = useEnvironment(selectConfig, shallow);
  const {
    tokens: poolTokens,
    lpToken,
    poolLpMint,
    userLpTokenAccount,
    state: poolState,
  } = usePool(poolSpec.id);
  const poolMath = usePoolMath(poolSpec.id);
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const startNewInteractionV1 = useStartNewInteraction(() => {
    if (method === RemoveMethod.ExactOutput) {
      setFormOutputAmounts(formOutputAmounts.map(() => "0"));
    }
  });
  const startNewInteractionV2 = useStartNewInteractionV2(() => {
    if (method === RemoveMethod.ExactOutput) {
      setFormOutputAmounts(formOutputAmounts.map(() => "0"));
    }
  });
  const startNewInteraction = poolSpec.isLegacyPool
    ? startNewInteractionV1
    : startNewInteractionV2;
  const isInteractionInProgress = useHasActiveInteraction();
  const userLpBalances = useUserLpBalances(lpToken, userLpTokenAccount);
  const wallets = useWallets();
  const userNativeBalances = useUserNativeBalances();

  const [lpTokenSourceEcosystem, setLpTokenSourceEcosystem] = useState(
    poolSpec.ecosystem,
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
    readonly TokenConfig[]
  > = poolTokens.reduce(
    (accumulator, tokenConfig) => {
      const ecosystem = poolSpec.isLegacyPool
        ? tokenConfig.nativeEcosystemId
        : poolSpec.ecosystem;
      return {
        ...accumulator,
        [ecosystem]: [...accumulator[ecosystem], tokenConfig],
      };
    },
    {
      [APTOS_ECOSYSTEM_ID]: [],
      [SOLANA_ECOSYSTEM_ID]: [],
      [EvmEcosystemId.Ethereum]: [],
      [EvmEcosystemId.Bnb]: [],
      [EvmEcosystemId.Avalanche]: [],
      [EvmEcosystemId.Polygon]: [],
      [EvmEcosystemId.Aurora]: [],
      [EvmEcosystemId.Fantom]: [],
      [EvmEcosystemId.Karura]: [],
      [EvmEcosystemId.Acala]: [],
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
      poolState !== null && isEvmPoolState(poolState)
        ? Amount.fromHuman(lpToken, poolState.totalLpSupply)
        : poolLpMint
        ? Amount.fromAtomicString(
            lpToken,
            poolLpMint.supply.toString(),
            poolSpec.ecosystem,
          )
        : null,
    [poolLpMint, lpToken, poolSpec.ecosystem, poolState],
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
          ? poolMath.removeUniform(exactBurnAmount.toHuman(poolSpec.ecosystem))
          : null;

      // eslint-disable-next-line functional/prefer-readonly-type
      const newFormOutputAmounts: string[] = [];
      for (const [tokenIndex, tokenConfig] of poolTokens.entries()) {
        let estimatedOutputAmountDecimal = new Decimal(0);

        if (method === RemoveMethod.Uniform && removeUniformAmounts !== null) {
          estimatedOutputAmountDecimal = removeUniformAmounts[tokenIndex];
        } else if (
          method === RemoveMethod.ExactBurn &&
          burnPercentage > 0 &&
          outputToken === tokenConfig.id
        ) {
          const { stableOutputAmount } = poolMath.removeExactBurn(
            exactBurnAmount.toHuman(poolSpec.ecosystem),
            tokenIndex,
          );
          estimatedOutputAmountDecimal = stableOutputAmount;
        }

        const estimatedOutputAmount = Amount.fromHuman(
          tokenConfig,
          estimatedOutputAmountDecimal,
        );

        // eslint-disable-next-line functional/immutable-data
        newFormOutputAmounts.push(
          // toHumanString because thousands separators would mess up the conversion
          estimatedOutputAmount.toHumanString(tokenConfig.nativeEcosystemId),
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

  const { data: feesEstimationV2 = null } = useRemoveFeesEstimationQueryV2(
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
        outputAmounts.map((amount) => amount.toHuman(poolSpec.ecosystem)),
      );
      return Amount.fromHuman(lpToken, lpInputAmount);
    }, null);
  }, [outputAmounts, poolMath, method, lpToken, poolSpec.ecosystem]);

  const maximumBurnAmount =
    estimatedLpInput && maxSlippageFraction
      ? estimatedLpInput.add(estimatedLpInput.mul(maxSlippageFraction))
      : null;

  const onOutputAmountBlur = (
    rawAmount: string,
    tokenConfig: TokenConfig,
  ): void => {
    const outputAmount = outputAmountsById.get(tokenConfig.id) ?? null;
    let errors: readonly string[] = [];

    // TODO: add maximum amount check

    if (outputAmount === null) {
      const onChange = createOnChange(tokenConfig);
      onChange("0");
    } else if (outputAmount.isNegative()) {
      errors = [t("general.amount_of_tokens_less_than_zero")];
    } else if (outputAmount.requiresRounding(tokenConfig.nativeEcosystemId)) {
      errors = [t("general.amount_of_tokens_too_many_decimals")];
    }

    setOutputAmountErrors(
      new Map([...outputAmountErrors, [tokenConfig.id, errors]]),
    );
  };

  const lpSourceEcosystemOptions: readonly EuiRadioGroupOption[] = [
    lpToken.nativeEcosystemId,
    ...(poolSpec.isLegacyPool ? lpToken.wrappedDetails.keys() : []),
  ].map((ecosystemId) => {
    const ecosystem = ECOSYSTEMS[ecosystemId];
    const lpBalance = userLpBalances[ecosystemId];
    const lpBalanceSuffix = lpBalance && (
      <>
        &nbsp;
        {t("general.with_brackets", {
          content: lpBalance.toFormattedHumanString(lpToken.nativeEcosystemId),
        })}
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
          {
            id: RemoveMethod.ExactBurn,
            label: t("remove_token_form.to_a_single_token"),
          },
          {
            id: RemoveMethod.Uniform,
            label: t("remove_token_form.proportionally_to_all_tokens"),
          },
          {
            id: RemoveMethod.ExactOutput,
            label: t("remove_token_form.enter_exact_output_amounts"),
          },
        ]
      : [
          {
            id: RemoveMethod.ExactBurn,
            label: t("remove_token_form.burn_exact_amount"),
          },
          {
            id: RemoveMethod.ExactOutput,
            label: t("remove_token_form.enter_exact_output_amounts"),
          },
        ];

  const outputTokenOptions: readonly EuiSelectOption[] = poolSpec.tokens.map(
    (id) => {
      const tokenConfig = findOrThrow(
        config.tokens,
        (token) => token.id === id,
      );
      return {
        value: id,
        text: `${TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].displayName} (${
          ECOSYSTEMS[tokenConfig.nativeEcosystemId].displayName
        })`,
      };
    },
  );

  const createOnChange = (tokenConfig: TokenConfig) => (value: string) => {
    const i = poolTokens.findIndex(({ id }) => id === tokenConfig.id);
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
      poolSpec.isLegacyPool ? feesEstimation : feesEstimationV2,
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
      const swimUiError = captureAndWrapException(
        t("general.unexpected_error"),
        error,
      );
      setFormErrors([swimUiError.toPrettyString()]);
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
      notify(
        t("notify.could_not_fetch_pool_lp_amount_error_title"),
        t("notify.could_not_fetch_pool_lp_amount_error_description"),
        "error",
      );
      return;
    }

    const requiredEcosystems = new Set(
      poolSpec.isLegacyPool
        ? [
            SOLANA_ECOSYSTEM_ID,
            lpTokenSourceEcosystem,
            ...poolTokens.map((tokenConfig, i) => {
              const outputAmount = outputAmounts[i];
              return outputAmount !== null && !outputAmount.isZero()
                ? tokenConfig.nativeEcosystemId
                : null;
            }),
          ].filter(isNotNull)
        : [poolSpec.ecosystem],
    );

    requiredEcosystems.forEach((ecosystemId) => {
      errors = [
        ...errors,
        t("general.ecosystem.disabled", { ecosystemName: ecosystemId }),
      ];
    });

    // Require connected wallets
    requiredEcosystems.forEach((ecosystem) => {
      if (!wallets[ecosystem].connected) {
        errors = [
          ...errors,
          t("general.connect_specific_wallet", {
            ecosystemName: ECOSYSTEMS[ecosystem].displayName,
          }),
        ];
      }
    });

    // Require non-zero native balances
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          t("general.require_non_empty_balance_in_specific_wallet", {
            ecosystemName: ECOSYSTEMS[SOLANA_ECOSYSTEM_ID].displayName,
          }),
        ];
      }
    });

    // Need some SOL for network fee
    if (
      userNativeBalances[SOLANA_ECOSYSTEM_ID].greaterThan(0) &&
      userNativeBalances[SOLANA_ECOSYSTEM_ID].lessThan(0.01)
    ) {
      errors = [
        ...errors,
        t("general.require_some_balance_in_solana_wallet", {
          minimumFee: 0.01,
        }),
      ];
    }

    // Require valid slippage setting
    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, t("general.require_a_valid_max_slippage_setting")];
    }

    // Require LP tokens
    if (
      userLpBalances[lpTokenSourceEcosystem] === null ||
      userLpBalances[lpTokenSourceEcosystem]?.isZero()
    ) {
      errors = [
        ...errors,
        t("remove_token_form.require_lp_tokens", {
          ecosystemName: ECOSYSTEMS[lpTokenSourceEcosystem].displayName,
        }),
      ];
    }

    // Require enough LP tokens
    if (method === RemoveMethod.ExactOutput) {
      if (
        estimatedLpInput !== null &&
        userLpBalance !== null &&
        estimatedLpInput.gt(userLpBalance)
      ) {
        errors = [...errors, t("remove_token_form.require_enough_lp_tokens")];
      }

      // Require at least one output amount
      if (outputAmounts.every((amount) => amount === null || amount.isZero())) {
        errors = [
          ...errors,
          t("remove_token_form.require_at_least_one_output_amount"),
        ];
      }
    }

    // Require valid burn percentage
    if (method !== RemoveMethod.ExactOutput && burnPercentage === 0) {
      errors = [
        ...errors,
        t("remove_token_form.require_burn_percentage_more_than_zero"),
      ];
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
        t("notify.unexpected_form_error_title"),
        t("notify.unexpected_form_error_description"),
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

  const lpTokenProject = TOKEN_PROJECTS_BY_ID[lpToken.projectId];
  const maximumLpBurnLabel = poolSpec.isStakingPool
    ? t("remove_token_form.max_required_lp_tokens", {
        tokenSymbol: lpTokenProject.symbol,
      })
    : t("remove_token_form.max_required_tokens", {
        tokenSymbol: lpTokenProject.symbol,
      });

  return (
    <EuiForm component="form" onSubmit={handleFormSubmit}>
      <EuiSpacer size="m" />
      <EuiFormRow
        label={t("remove_token_form.use_lp_tokens_from", {
          tokenSymbol: lpTokenProject.symbol,
        })}
        helpText={
          lpTokenSourceEcosystem === SOLANA_ECOSYSTEM_ID ||
          method !== RemoveMethod.ExactOutput
            ? ""
            : t("remove_token_form.lp_tokens_explanation", {
                tokenName: ECOSYSTEMS[lpTokenSourceEcosystem].displayName,
              })
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

      <EuiFormRow label={t("remove_token_form.remove_method")}>
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
                t("notify.burn_all_lp_tokens_error_title"),
                t("notify.burn_all_lp_tokens_error_description"),
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
          <span>{maximumLpBurnLabel}&nbsp;</span>
          <span>
            {maximumBurnAmount !== null
              ? maximumBurnAmount.toFormattedHumanString(lpTokenSourceEcosystem)
              : "-"}
          </span>
        </>
      ) : (
        <EuiFormRow
          label={t("remove_token_form.burn_percentage")}
          helpText={
            method === RemoveMethod.ExactBurn &&
            userHasAllLpTokens &&
            burnPercentage === 99
              ? t("remove_token_form.burnt_most_lp_tokens_error")
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
          <EuiFormRow label={t("remove_token_form.output_token")}>
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
            {ecosystemTokens.map((tokenConfig) => {
              const onChange = createOnChange(tokenConfig);
              return (
                <EuiFormRow
                  fullWidth
                  key={tokenConfig.id}
                  isInvalid={
                    (outputAmountErrors.get(tokenConfig.id) ?? []).length > 0
                  }
                  error={outputAmountErrors.get(tokenConfig.id)}
                >
                  <EuiFieldText
                    placeholder={t("general.enter_amount_of_tokens")}
                    name={tokenConfig.id}
                    value={
                      method === RemoveMethod.ExactOutput
                        ? formOutputAmountsById.get(tokenConfig.id) ?? "0"
                        : outputAmountsById
                            .get(tokenConfig.id)
                            ?.toFormattedHumanString(
                              tokenConfig.nativeEcosystemId,
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
                      onOutputAmountBlur(e.target.value, tokenConfig);
                    }}
                    isInvalid={
                      (outputAmountErrors.get(tokenConfig.id) ?? []).length > 0
                    }
                    prepend={
                      <EuiButtonEmpty size="xs">
                        <TokenIcon
                          {...TOKEN_PROJECTS_BY_ID[tokenConfig.projectId]}
                        />
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

      {hasPositiveOutputAmount && (
        <EstimatedTxFeesCallout
          feesEstimation={
            poolSpec.isLegacyPool ? feesEstimation : feesEstimationV2
          }
        />
      )}

      <EuiButton
        type="submit"
        fullWidth
        fill
        isLoading={isInteractionInProgress}
        isDisabled={isSubmitted}
      >
        {poolSpec.isStakingPool
          ? t("glossary.unstake_tokens")
          : t("general.remove_tokens_from_pool")}
      </EuiButton>
      <EuiSpacer />

      {poolSpec.isLegacyPool ? (
        <RecentInteractions
          title={t("remove_token_form.recent_removes")}
          interactionTypes={INTERACTION_GROUP_REMOVE}
        />
      ) : (
        <RecentInteractionsV2
          title={t("remove_token_form.recent_removes")}
          interactionTypes={INTERACTION_GROUP_REMOVE}
        />
      )}

      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText={t("remove_token_modal.title")}
        cancelText={t("general.cancel_button")}
        confirmText={t("general.remove_tokens_from_pool")}
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
