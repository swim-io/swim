import type { EuiRadioGroupOption } from "@elastic/eui";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldNumber,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import type Decimal from "decimal.js";
import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
  ECOSYSTEM_IDS,
  EcosystemId,
  getNativeTokenDetails,
  isEcosystemEnabled,
} from "../config";
import type { PoolSpec, TokenSpec } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useNotification } from "../core/store";
import { captureAndWrapException } from "../errors";
import {
  useAddFeesEstimationQuery,
  useMultipleUserBalances,
  usePool,
  usePoolMath,
  useSplTokenAccountsQuery,
  useUserBalanceAmounts,
  useUserNativeBalances,
  useWallets,
} from "../hooks";
import {
  useHasActiveInteraction,
  useStartNewInteraction,
} from "../hooks/interaction";
import {
  Amount,
  INTERACTION_GROUP_ADD,
  InteractionType,
  getLowBalanceWallets,
  isValidSlippageFraction,
} from "../models";
import { filterMap, isEachNotNull, isNotNull } from "../utils";

import { ConfirmModal } from "./ConfirmModal";
import { ConnectButton } from "./ConnectButton";
import { EstimatedTxFeesCallout } from "./EstimatedTxFeesCallout";
import { LowBalanceDescription } from "./LowBalanceDescription";
import { PoolPausedAlert } from "./PoolPausedAlert";
import { RecentInteractions } from "./RecentInteractions";
import { SolanaTpsWarning } from "./SolanaTpsWarning";
import { TokenIcon } from "./TokenIcon";

interface TokenAddPanelProps {
  readonly tokenSpec: TokenSpec;
  readonly inputAmount: string;
  readonly errors: readonly string[];
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
}

const TokenAddPanel = ({
  tokenSpec,
  inputAmount,
  errors,
  disabled,
  onChange,
  onBlur,
}: TokenAddPanelProps): ReactElement => {
  const balanceAmounts = useUserBalanceAmounts(tokenSpec);
  const balance = balanceAmounts[tokenSpec.nativeEcosystem];
  const { decimals: nativeDecimals } = getNativeTokenDetails(tokenSpec);

  return (
    <EuiFormRow
      fullWidth
      key={tokenSpec.id}
      labelAppend={
        <EuiText size="xs">
          <span>Max:</span>{" "}
          {balance !== null ? (
            <EuiLink
              onClick={() => {
                onChange(balance.toHumanString(tokenSpec.nativeEcosystem));
              }}
            >
              {balance.toFormattedHumanString(tokenSpec.nativeEcosystem)}
            </EuiLink>
          ) : (
            "-"
          )}
        </EuiText>
      }
      isInvalid={errors.length > 0}
      error={errors}
    >
      <EuiFieldNumber
        placeholder="Enter amount"
        name={tokenSpec.id}
        value={inputAmount}
        step={10 ** -nativeDecimals}
        fullWidth
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        isInvalid={errors.length > 0}
        prepend={
          <EuiButtonEmpty size="xs">
            <TokenIcon {...tokenSpec.project} />
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
  const { notify } = useNotification();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const {
    tokens: poolTokens,
    lpToken,
    nativeEcosystems,
    isPoolPaused,
  } = usePool(poolSpec.id);
  const poolMath = usePoolMath(poolSpec.id);
  const userBalances = useMultipleUserBalances(poolTokens);
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const startNewInteraction = useStartNewInteraction(() => {
    setFormInputAmounts(poolTokens.map(() => "0"));
  });
  const isInteractionInProgress = useHasActiveInteraction();
  const userNativeBalances = useUserNativeBalances();

  const [lpTargetEcosystem, setLpTargetEcosystem] = useState(
    EcosystemId.Solana,
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

  const hasPositiveInputAmount = inputAmounts.some(
    (amount) => amount && !amount.isZero(),
  );

  const estimatedLpOutput = useMemo(() => {
    if (!poolMath || !isEachNotNull(inputAmounts)) {
      return null;
    }
    try {
      const { lpOutputAmount } = poolMath.add(
        inputAmounts.map((amount) => amount.toHuman(EcosystemId.Solana)),
      );
      return Amount.fromHuman(lpToken, lpOutputAmount);
    } catch {
      return null;
    }
  }, [inputAmounts, poolMath, lpToken]);
  const minimumMintAmount =
    estimatedLpOutput && maxSlippageFraction
      ? estimatedLpOutput.sub(estimatedLpOutput.mul(maxSlippageFraction))
      : null;

  const lpTargetEcosystemOptions: readonly EuiRadioGroupOption[] = [
    ...lpToken.detailsByEcosystem.keys(),
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
        errors = ["Invalid number"];
      } else if (
        amount
          .toAtomic(tokenSpec.nativeEcosystem)
          .gt(userBalance.toAtomic(tokenSpec.nativeEcosystem))
      ) {
        errors = ["Amount cannot exceed available balance"];
        // } else if (amount.toHuman(tokenSpec.nativeEcosystem).gt(5)) {
        //   errors = ["During testing, all transactions are limited to $5"];
      } else if (amount.isNegative()) {
        errors = ["Amount must be greater than or equal to zero"];
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
      handleSubmit();
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

  const handleSubmit = (): void => {
    // reset everything
    setFormErrors([]);
    let errors: readonly string[] = [];

    const requiredEcosystems = new Set(
      [
        EcosystemId.Solana,
        lpTargetEcosystem,
        ...poolTokens.map((tokenSpec, i) => {
          const inputAmount = inputAmounts[i];
          return inputAmount !== null && !inputAmount.isZero()
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
          `Connect ${config.ecosystems[ecosystem].displayName} wallet`,
        ];
      }
    });

    // Require non-zero native balances
    requiredEcosystems.forEach((ecosystem) => {
      if (userNativeBalances[ecosystem].isZero()) {
        errors = [
          ...errors,
          `Empty balance in ${config.ecosystems[ecosystem].displayName} wallet. You will need some funds to pay for transaction fees.`,
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

    // Require at least one amount
    if (
      inputAmounts.every(
        (amount) => amount === null || amount.isNegative() || amount.isZero(),
      )
    ) {
      errors = [...errors, "Provide at least one amount"];
    }

    // Disallow invalid amounts
    if (inputAmounts.some((amount) => amount === null)) {
      errors = [...errors, "Fix invalid amounts"];
    }

    // Require valid slippage setting
    if (!isValidSlippageFraction(maxSlippageFraction)) {
      errors = [...errors, "Provide a valid max slippage setting"];
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
        "Form error",
        "There was an unexpected error submitting the form. Developers were notified.",
        "error",
      );
      return;
    }

    startNewInteraction({
      type: InteractionType.Add,
      poolId: poolSpec.id,
      params: {
        inputAmounts,
        minimumMintAmount,
      },
      lpTokenTargetEcosystem: lpTargetEcosystem,
    });
  };

  const receiveLabel = poolSpec.isStakingPool
    ? `Receive ${lpToken.project.symbol} on`
    : `Receive LP tokens (${lpToken.project.symbol}) on`;

  return (
    <EuiForm component="form" className="addForm" onSubmit={handleFormSubmit}>
      <EuiSpacer size="m" />

      {/* TODO: Maybe display those side by side with EuiFlex */}
      {filterMap(
        isEcosystemEnabled,
        (ecosystemId) => {
          const indices = [...new Array(poolTokens.length)]
            .map((_, i) => i)
            .filter((i) => poolTokens[i].nativeEcosystem === ecosystemId);
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

      <PoolPausedAlert isVisible={!!isPoolPaused} />

      {hasPositiveInputAmount && (
        <EstimatedTxFeesCallout feesEstimation={feesEstimation} />
      )}

      <EuiButton
        type="submit"
        fullWidth
        fill
        isLoading={isInteractionInProgress}
        isDisabled={isPoolPaused || isSubmitted}
      >
        {poolSpec.isStakingPool ? "Stake" : "Add"}
      </EuiButton>

      <EuiSpacer />

      <RecentInteractions
        title={"Recent adds"}
        interactionTypes={INTERACTION_GROUP_ADD}
      />

      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onCancel={handleConfirmModalCancel}
        onConfirm={handleConfirmModalConfirm}
        titleText="Execute Add?"
        cancelText="Cancel"
        confirmText="Add"
        promptText={confirmModalDescription}
      />
    </EuiForm>
  );
};
