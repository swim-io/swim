import type { EuiRadioGroupOption } from "@elastic/eui";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { filterMap, isEachNotNull, isNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
  ECOSYSTEM_IDS,
  EcosystemId,
  isEcosystemEnabled,
} from "../config";
import type { PoolSpec, TokenSpec } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  useAddFeesEstimationQuery,
  useAddFeesEstimationQueryV2,
  useMultipleUserBalances,
  usePool,
  usePoolMath,
  useSplTokenAccountsQuery,
  useUserBalanceAmount,
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
  INTERACTION_GROUP_ADD,
  InteractionType,
  getLowBalanceWallets,
  isValidSlippageFraction,
} from "../models";

import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { EuiFieldIntlNumber } from "./EuiFieldIntlNumber";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { RecentInteractions } from "./RecentInteractions";
import { RecentInteractionsV2 } from "./RecentInteractionsV2";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { TokenIcon } from "./TokenIcon";

interface TokenAddPanelProps {
  readonly tokenSpec: TokenSpec;
  readonly ecosystemId: EcosystemId;
  readonly inputAmount: string;
  readonly errors: readonly string[];
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
}

const TokenAddPanel = ({
  tokenSpec,
  ecosystemId,
  inputAmount,
  errors,
  disabled,
  onChange,
  onBlur,
}: TokenAddPanelProps): ReactElement => {
  const { t } = useTranslation();
  const tokenProject = TOKEN_PROJECTS_BY_ID[tokenSpec.projectId];
  const balance = useUserBalanceAmount(tokenSpec, ecosystemId);
  return (
    <EuiFormRow
      fullWidth
      key={tokenSpec.id}
      labelAppend={
        <EuiText size="xs">
          <span>{t("add_token_form.max_amount_of_tokens")}</span>{" "}
          {balance !== null ? (
            <EuiLink
              onClick={() => {
                onChange(balance.toHumanString(tokenSpec.nativeEcosystemId));
              }}
            >
              {balance.toFormattedHumanString(tokenSpec.nativeEcosystemId)}
            </EuiLink>
          ) : (
            "-"
          )}
        </EuiText>
      }
      isInvalid={errors.length > 0}
      error={errors}
    >
      <EuiFieldIntlNumber
        placeholder={t("general.enter_amount_of_tokens")}
        name={tokenSpec.id}
        defaultValue={inputAmount}
        step={10 ** -tokenSpec.nativeDetails.decimals}
        fullWidth
        disabled={disabled}
        onValueChange={onChange}
        onBlur={onBlur}
        isInvalid={errors.length > 0}
        prepend={
          <EuiButtonEmpty size="xs">
            <TokenIcon {...tokenProject} />
          </EuiButtonEmpty>
        }
      />
    </EuiFormRow>
  );
};

interface EcosystemAddPanelProps {
  readonly ecosystemId: EcosystemId;
  readonly nEcosystemsInPool: number;
  readonly tokens: readonly TokenSpec[];
  readonly errors: readonly (readonly string[])[];
  readonly inputAmounts: readonly string[];
  readonly disabled: boolean;
  readonly changeHandlers: readonly ((value: string) => void)[];
  readonly blurHandlers: readonly (() => void)[];
}

const EcosystemAddPanel = ({
  ecosystemId,
  nEcosystemsInPool,
  tokens,
  errors,
  inputAmounts,
  disabled,
  changeHandlers,
  blurHandlers,
}: EcosystemAddPanelProps): ReactElement => {
  if (tokens.length === 0) {
    return <></>;
  }
  return (
    <EuiPanel
      key={ecosystemId}
      hasShadow={false}
      hasBorder={nEcosystemsInPool > 1}
      paddingSize={nEcosystemsInPool > 1 ? "s" : "none"}
      style={{ marginBottom: "24px" }}
    >
      <ConnectButton ecosystemId={ecosystemId} fullWidth />
      <EuiSpacer size="m" />
      {tokens.map((tokenSpec, i) => (
        <TokenAddPanel
          key={tokenSpec.id}
          tokenSpec={tokenSpec}
          ecosystemId={ecosystemId}
          inputAmount={inputAmounts[i]}
          errors={errors[i]}
          disabled={disabled}
          onChange={changeHandlers[i]}
          onBlur={blurHandlers[i]}
        />
      ))}
    </EuiPanel>
  );
};

interface AddFormProps {
  readonly poolSpec: PoolSpec;
  readonly maxSlippageFraction: Decimal | null;
}

export const AddForm = ({
  poolSpec,
  maxSlippageFraction,
}: AddFormProps): ReactElement => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const { isLegacyPool } = poolSpec;
  const {
    tokens: poolTokens,
    lpToken,
    nativeEcosystems,
    isPoolPaused,
  } = usePool(poolSpec.id);
  const poolMath = usePoolMath(poolSpec.id);
  const userBalances = useMultipleUserBalances(
    poolTokens,
    poolSpec.isLegacyPool ? undefined : poolSpec.ecosystem,
  );
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const startNewInteraction = useStartNewInteraction(() => {
    setFormInputAmounts(poolTokens.map(() => "0"));
  });
  const startNewInteractionV2 = useStartNewInteractionV2(() => {
    setFormInputAmounts(poolTokens.map(() => "0"));
  });
  const isInteractionInProgress = useHasActiveInteraction();
  const userNativeBalances = useUserNativeBalances();

  const [lpTargetEcosystem, setLpTargetEcosystem] = useState(
    poolSpec.ecosystem,
  );

  const [formInputAmounts, setFormInputAmounts] = useState<readonly string[]>(
    poolTokens.map(() => "0"),
  );

  const [formErrors, setFormErrors] = useState<readonly string[]>([]);
  const [inputAmountErrors, setInputAmountErrors] = useState<
    readonly (readonly string[])[]
  >(poolTokens.map(() => []));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmModalDescription, setConfirmModalDescription] =
    useState<ReactElement | null>(null);
  const isConfirmModalVisible = confirmModalDescription !== null;
  const handleConfirmModalCancel = (): void => setConfirmModalDescription(null);
  const handleConfirmModalConfirm = (): void => {
    setConfirmModalDescription(null);
    handleSubmit();
  };
  const inputAmounts = useMemo<readonly (Amount | null)[]>(
    () =>
      formInputAmounts.map((amount, i) => {
        try {
          return Amount.fromHumanString(poolTokens[i], amount);
        } catch {
          return null;
        }
      }),
    [poolTokens, formInputAmounts],
  );

  const feesEstimation = useAddFeesEstimationQuery(
    inputAmounts,
    lpTargetEcosystem,
  );

  const { data: feesEstimationV2 = null } = useAddFeesEstimationQueryV2(
    inputAmounts,
    lpTargetEcosystem,
  );

  const hasPositiveInputAmount = inputAmounts.some(
    (amount) => amount && !amount.isZero(),
  );

  const estimatedLpOutput = useMemo(() => {
    if (!poolMath || !isEachNotNull(inputAmounts)) {
      return null;
    }
    try {
      const { lpOutputAmount } = poolMath.add(
        inputAmounts.map((amount) => amount.toHuman(poolSpec.ecosystem)),
      );
      return Amount.fromHuman(lpToken, lpOutputAmount);
    } catch {
      return null;
    }
  }, [inputAmounts, poolMath, lpToken, poolSpec.ecosystem]);
  const minimumMintAmount =
    estimatedLpOutput && maxSlippageFraction
      ? estimatedLpOutput.sub(estimatedLpOutput.mul(maxSlippageFraction))
      : null;

  const lpTargetEcosystemOptions: readonly EuiRadioGroupOption[] = [
    lpToken.nativeEcosystemId,
    ...(poolSpec.isLegacyPool ? lpToken.wrappedDetails.keys() : []),
  ].map((ecosystemId) => {
    const ecosystem = ECOSYSTEMS[ecosystemId];
    return {
      id: ecosystemId,
      label: (
        <>
          <EuiIcon type={ecosystem.logo} />
          &nbsp;{ecosystem.displayName}
        </>
      ),
    };
  });

  const formInputChangeHandlers = poolTokens.map(
    (_, tokenIndex) =>
      (value: string): void => {
        setFormInputAmounts([
          ...formInputAmounts.slice(0, tokenIndex),
          value,
          ...formInputAmounts.slice(tokenIndex + 1),
        ]);
      },
  );

  const formInputBlurHandlers = poolTokens.map(
    (tokenSpec, tokenIndex) => (): void => {
      const amount = inputAmounts[tokenIndex] ?? null;
      const userBalance =
        userBalances.get(tokenSpec.id) ?? Amount.zero(tokenSpec);

      let errors: readonly string[] = [];
      if (amount === null) {
        errors = [t("general.amount_of_tokens_invalid")];
      } else if (
        amount
          .toAtomic(tokenSpec.nativeEcosystemId)
          .gt(userBalance.toAtomic(tokenSpec.nativeEcosystemId))
      ) {
        errors = [t("general.amount_of_tokens_exceed_balance")];
        // } else if (amount.toHuman(tokenSpec.nativeEcosystemId).gt(5)) {
        //   errors = ["During testing, all transactions are limited to $5"];
      } else if (amount.isNegative()) {
        errors = [t("general.amount_of_tokens_less_than_zero")];
      } else if (amount.requiresRounding(tokenSpec.nativeEcosystemId)) {
        errors = [t("general.amount_of_tokens_too_many_decimals")];
      }

      setInputAmountErrors([
        ...inputAmountErrors.slice(0, tokenIndex),
        errors,
        ...inputAmountErrors.slice(tokenIndex + 1),
      ]);
    },
  );

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
      handleSubmit();
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

  const handleSubmit = (): void => {
    // reset everything
    setFormErrors([]);
    let errors: readonly string[] = [];

    const requiredEcosystems = new Set(
      isLegacyPool
        ? [
            EcosystemId.Solana,
            lpTargetEcosystem,
            ...poolTokens.map((tokenSpec, i) => {
              const inputAmount = inputAmounts[i];
              return inputAmount !== null && !inputAmount.isZero()
                ? tokenSpec.nativeEcosystemId
                : null;
            }),
          ].filter(isNotNull)
        : [poolSpec.ecosystem],
    );

    // Require connected wallets
    requiredEcosystems.forEach((ecosystem) => {
      if (!wallets[ecosystem].connected) {
        errors = [
          ...errors,
          t("general.connect_specific_wallet", {
            ecosystemName: config.ecosystems[ecosystem].displayName,
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
            ecosystemName: config.ecosystems[ecosystem].displayName,
          }),
        ];
      }
    });

    // Need some SOL for network fee
    if (
      isLegacyPool &&
      userNativeBalances[EcosystemId.Solana].greaterThan(0) &&
      userNativeBalances[EcosystemId.Solana].lessThan(0.01)
    ) {
      errors = [
        ...errors,
        t("general.require_some_balance_in_solana_wallet", {
          minimumFee: 0.01,
        }),
      ];
    }

    // Require at least one amount
    if (
      inputAmounts.every(
        (amount) => amount === null || amount.isNegative() || amount.isZero(),
      )
    ) {
      errors = [...errors, t("add_token_form.require_at_least_one_token")];
    }

    // Disallow invalid amounts
    if (inputAmounts.some((amount) => amount === null)) {
      errors = [...errors, t("add_token_form.require_to_fix_invalid_amount")];
    }

    // Require valid slippage setting
    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, t("general.require_a_valid_max_slippage_setting")];
    }

    if (errors.length > 0) {
      setFormErrors([...errors]);
      return;
    }

    // These are just for type safety and should in theory not happen
    if (
      splTokenAccounts === null ||
      minimumMintAmount === null ||
      !inputAmounts.every(isNotNull) ||
      maxSlippageFraction === null ||
      poolMath === null
    ) {
      notify(
        t("notify.unexpected_form_error_title"),
        t("notify.unexpected_form_error_description"),
        "error",
      );
      return;
    }

    if (isLegacyPool) {
      startNewInteraction({
        type: InteractionType.Add,
        poolId: poolSpec.id,
        params: {
          inputAmounts,
          minimumMintAmount,
        },
        lpTokenTargetEcosystem: lpTargetEcosystem,
      });
    } else {
      startNewInteractionV2({
        type: InteractionType.Add,
        poolId: poolSpec.id,
        params: {
          inputAmounts,
          minimumMintAmount,
        },
        lpTokenTargetEcosystem: lpTargetEcosystem,
      });
    }
  };

  const lpTokenProject = TOKEN_PROJECTS_BY_ID[lpToken.projectId];
  const receiveLabel = poolSpec.isStakingPool
    ? t("add_token_form.choose_receive_tokens_on", {
        tokenSymbol: lpTokenProject.symbol,
      })
    : t("add_token_form.choose_receive_lp_tokens_on", {
        tokenSymbol: lpTokenProject.symbol,
      });

  return (
    <EuiForm component="form" className="addForm" onSubmit={handleFormSubmit}>
      <EuiSpacer size="m" />

      {/* TODO: Maybe display those side by side with EuiFlex */}
      {isLegacyPool &&
        filterMap(
          isEcosystemEnabled,
          (ecosystemId) => {
            const indices = Array.from({ length: poolTokens.length })
              .map((_, i) => i)
              .filter((i) => poolTokens[i].nativeEcosystemId === ecosystemId);
            const isRelevant = (_: any, i: number): boolean =>
              indices.includes(i);
            const tokens = poolTokens.filter(isRelevant);
            const errors = inputAmountErrors.filter(isRelevant);
            const filteredInputAmounts = formInputAmounts.filter(isRelevant);
            const changeHandlers = formInputChangeHandlers.filter(isRelevant);
            const blurHandlers = formInputBlurHandlers.filter(isRelevant);
            return (
              <EcosystemAddPanel
                key={ecosystemId}
                ecosystemId={ecosystemId}
                nEcosystemsInPool={nativeEcosystems.length}
                tokens={tokens}
                errors={errors}
                inputAmounts={filteredInputAmounts}
                disabled={
                  !wallets[ecosystemId].connected || isInteractionInProgress
                }
                changeHandlers={changeHandlers}
                blurHandlers={blurHandlers}
              />
            );
          },
          ECOSYSTEM_IDS,
        )}

      {!isLegacyPool && (
        <EcosystemAddPanel
          key={poolSpec.ecosystem}
          ecosystemId={poolSpec.ecosystem}
          nEcosystemsInPool={nativeEcosystems.length}
          tokens={poolTokens}
          errors={inputAmountErrors}
          inputAmounts={formInputAmounts}
          disabled={
            !wallets[poolSpec.ecosystem].connected || isInteractionInProgress
          }
          changeHandlers={formInputChangeHandlers}
          blurHandlers={formInputBlurHandlers}
        />
      )}

      <EuiFormRow label={receiveLabel}>
        <EuiRadioGroup
          name="selectLpTargetEcosystem"
          options={[...lpTargetEcosystemOptions]}
          idSelected={lpTargetEcosystem}
          onChange={(ecosystem) => {
            setLpTargetEcosystem(ecosystem as EcosystemId);
          }}
          disabled={isInteractionInProgress}
        />
      </EuiFormRow>

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

      <PoolPausedAlert isVisible={!!isPoolPaused} />

      {hasPositiveInputAmount && (
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
        isDisabled={isPoolPaused || isSubmitted}
      >
        {poolSpec.isStakingPool
          ? t("glossary.stake_tokens")
          : t("general.add_tokens_to_pool")}
      </EuiButton>

      <EuiSpacer />

      {poolSpec.isLegacyPool ? (
        <RecentInteractions
          title={t("add_token_form.recent_adds")}
          interactionTypes={INTERACTION_GROUP_ADD}
        />
      ) : (
        <RecentInteractionsV2
          title={t("add_token_form.recent_adds")}
          interactionTypes={INTERACTION_GROUP_ADD}
        />
      )}
      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText={t("add_token_modal.title")}
        cancelText={t("general.cancel_button")}
        confirmText={t("general.add_tokens_to_pool")}
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
