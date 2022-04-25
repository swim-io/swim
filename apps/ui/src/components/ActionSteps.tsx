import type { EuiStepProps } from "@elastic/eui";
import {
  EuiBadge,
  EuiButton,
  EuiCallOut,
  EuiListGroup,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiSteps,
  EuiText,
} from "@elastic/eui";
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import type { ReactElement } from "react";
import { useState } from "react";
import type { UseMutationResult } from "react-query";

import { EcosystemId, ecosystems } from "../config";
import { formatErrorJsx } from "../errors";
import type { StepMutations } from "../hooks";
import type {
  CreateSplTokenAccountsStep,
  PoolInteraction,
  ProtoTransfer,
  SolanaPoolInteractionStep,
  SolanaTx,
  Step,
  Steps,
  Transfer,
  Tx,
  TxsByTokenId,
  WormholeFromSolanaStep,
  WormholeToSolanaStep,
} from "../models";
import {
  Status,
  StepType,
  SwimDefiInstruction,
  combineTransfers,
  groupTxsByTokenId,
} from "../models";
import type { ReadonlyRecord } from "../utils";
import { isNotNull } from "../utils";

import { SolanaTxListItem, TxListItem } from "./TxListItem";

import "./ActionSteps.scss";

type Mutation<TData> = Pick<
  UseMutationResult<TData, Error, any>,
  "data" | "isLoading" | "isSuccess" | "isError" | "isIdle" | "error"
>;

type StepWithMutation =
  | {
      readonly type: StepType.CreateSplTokenAccounts;
      readonly step: CreateSplTokenAccountsStep;
      readonly retryInteraction: () => any;
      readonly mutation?: Mutation<readonly TokenAccountInfo[]>;
    }
  | {
      readonly type: StepType.WormholeToSolana;
      readonly step: WormholeToSolanaStep;
      readonly retryInteraction: () => any;
      readonly mutation?: Mutation<TxsByTokenId>;
    }
  | {
      readonly type: StepType.SolanaPoolInteraction;
      readonly interaction: PoolInteraction;
      readonly step: SolanaPoolInteractionStep;
      readonly retryInteraction: () => any;
      readonly mutation?: Mutation<SolanaTx>;
    }
  | {
      readonly type: StepType.WormholeFromSolana;
      readonly step: WormholeFromSolanaStep;
      readonly retryInteraction: () => any;
      readonly mutation?: Mutation<TxsByTokenId>;
    };

const getEuiStatus = (
  isComplete: boolean,
  mutation?: Mutation<any>,
): "loading" | "complete" | "danger" | "incomplete" => {
  if (isComplete) return "complete";
  if (mutation?.isLoading) return "loading";
  if (mutation?.isSuccess) return "complete";
  if (mutation?.isError) return "danger";
  return "incomplete";
};

interface LoadingIndicatorProps {
  readonly mutation?: Mutation<any>;
}

const LoadingIndicator = ({
  mutation,
}: LoadingIndicatorProps): ReactElement => (
  <EuiText size="s">{mutation?.isLoading ? "Loading..." : "Pending"}</EuiText>
);

interface MutationStatusProps {
  readonly title: string;
  readonly isComplete: boolean;
  readonly mutation?: Mutation<any>;
}

const MutationStatus = ({
  title,
  isComplete,
  mutation,
}: MutationStatusProps): ReactElement => (
  <EuiText size="m">
    <span>
      {mutation?.isLoading ? (
        <>
          <EuiLoadingSpinner size="m" />{" "}
        </>
      ) : null}
    </span>
    {title}
    <span>{!isComplete && mutation?.isIdle ? " (pending)" : null}</span>
  </EuiText>
);

interface ActionSubStepProps {
  readonly transfer: ProtoTransfer | Transfer;
  readonly isComplete: boolean;
  readonly txs: readonly Tx[] | null;
  readonly mutation?: Mutation<any>;
}

const ActionSubStep = ({
  transfer,
  isComplete,
  txs,
  mutation,
}: ActionSubStepProps): ReactElement => {
  if (transfer.amount?.isZero()) {
    return <></>;
  }
  const fromEcosystem = ecosystems[transfer.fromEcosystem];
  const toEcosystem = ecosystems[transfer.toEcosystem];
  return (
    <>
      <MutationStatus
        title={`Transfer ${transfer.token.displayName} from ${fromEcosystem.displayName} to ${toEcosystem.displayName}`}
        isComplete={isComplete}
        mutation={mutation}
      />
      {txs !== null ? (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {txs.map((tx) => (
            <TxListItem key={tx.txId} {...tx} />
          ))}
        </EuiListGroup>
      ) : null}
    </>
  );
};

interface CreateSplTokenAccountsActionStepProps {
  readonly step: CreateSplTokenAccountsStep;
  readonly mutation?: Mutation<readonly TokenAccountInfo[]>;
}

const CreateSplTokenAccountsActionStep = ({
  step,
  mutation,
}: CreateSplTokenAccountsActionStepProps): ReactElement => {
  const accounts = mutation?.data ?? null;
  return (
    <>
      {step.mints.map(
        (mint: string, i: number): ReactElement =>
          accounts === null ? (
            <LoadingIndicator key={mint} mutation={mutation} />
          ) : (
            <EuiListGroup
              key={mint}
              gutterSize="none"
              flush
              maxWidth={200}
              showToolTips
            >
              {accounts[i]?.address.toBase58() ?? "Account not found"}
            </EuiListGroup>
          ),
      )}
    </>
  );
};

interface WormholeActionStepProps {
  readonly step: WormholeToSolanaStep | WormholeFromSolanaStep;
  readonly mutation?: Mutation<TxsByTokenId>;
}

const WormholeActionStep = ({
  step,
  mutation,
}: WormholeActionStepProps): ReactElement => {
  const transfers = combineTransfers<Transfer | ProtoTransfer>(step.transfers);
  const involvesEthereum = transfers.some(
    (transfer: ProtoTransfer | Transfer) =>
      transfer.fromEcosystem === EcosystemId.Ethereum ||
      transfer.toEcosystem === EcosystemId.Ethereum,
  );
  return (
    <>
      {mutation?.isLoading && involvesEthereum ? (
        <>
          <EuiCallOut
            size="s"
            title="Please note that waiting for Ethereum block confirmations may take a few minutes."
            iconType="clock"
          />
          <EuiSpacer size="s" />
        </>
      ) : null}

      {transfers.map(
        (transfer: ProtoTransfer | Transfer): ReactElement => (
          <ActionSubStep
            key={transfer.token.id}
            transfer={transfer}
            isComplete={transfer.isComplete || step.isComplete}
            mutation={mutation}
            txs={step.txs[transfer.token.id] ?? null}
          />
        ),
      )}
    </>
  );
};

const poolInteractionStepTitles: ReadonlyRecord<SwimDefiInstruction, string> = {
  [SwimDefiInstruction.Add]: "Add tokens",
  [SwimDefiInstruction.Swap]: "Swap tokens",
  [SwimDefiInstruction.SwapExactOutput]: "Swap tokens",
  [SwimDefiInstruction.RemoveUniform]: "Remove tokens",
  [SwimDefiInstruction.RemoveExactBurn]: "Remove tokens",
  [SwimDefiInstruction.RemoveExactOutput]: "Remove tokens",
};

interface PoolInteractionActionStepProps {
  readonly step: SolanaPoolInteractionStep;
  readonly interaction: PoolInteraction;
  readonly mutation?: Mutation<SolanaTx>;
}

const PoolInteractionActionStep = ({
  interaction,
  step,
  mutation,
}: PoolInteractionActionStepProps): ReactElement => {
  // If we found tx via an existing interaction the ID will be available via the step.
  // Otherwise this might be an active interaction and the ID might be available via the mutation.
  const txId =
    step.txs.length > 0 ? step.txs[0].txId : mutation?.data?.txId ?? null;
  return (
    <>
      <MutationStatus
        title={poolInteractionStepTitles[interaction.instruction]}
        isComplete={step.isComplete}
        mutation={mutation}
      />
      {txId !== null ? (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          <SolanaTxListItem ecosystem={EcosystemId.Solana} txId={txId} />
        </EuiListGroup>
      ) : null}
    </>
  );
};

const ActionStep = (props: StepWithMutation): ReactElement => {
  switch (props.type) {
    case StepType.CreateSplTokenAccounts:
      return <CreateSplTokenAccountsActionStep {...props} />;
    case StepType.WormholeToSolana:
      return <WormholeActionStep {...props} />;
    case StepType.SolanaPoolInteraction:
      return <PoolInteractionActionStep {...props} />;
    case StepType.WormholeFromSolana:
      return <WormholeActionStep {...props} />;
    default:
      throw new Error("Step type not supported");
  }
};

interface StepErrorProps {
  readonly retryInteraction: () => any;
  readonly mutation: Mutation<any>;
}

const StepError = ({
  retryInteraction,
  mutation,
}: StepErrorProps): ReactElement => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitted) {
      return;
    }
    setIsSubmitted(true);
    try {
      await retryInteraction();
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <EuiCallOut
      title="Sorry, there was an error"
      color="danger"
      iconType="alert"
      style={{ wordBreak: "break-word" }} // break long transaction IDs
    >
      {formatErrorJsx(mutation.error)}
      <EuiSpacer />
      <EuiButton
        iconType="refresh"
        onClick={handleSubmit}
        size="s"
        isLoading={isSubmitted}
      >
        Retry
      </EuiButton>
      &nbsp;&nbsp;
      <EuiButton
        href="/help"
        onClick={(e) => {
          e.preventDefault();
          window.open("/help", "_blank");
        }}
        color="warning"
        iconType="popout"
        iconSide="right"
        size="s"
      >
        Get help
      </EuiButton>
    </EuiCallOut>
  );
};

const getStepTitle = (step: Step): string => {
  switch (step.type) {
    case StepType.CreateSplTokenAccounts:
      return "Create Solana accounts";
    case StepType.SolanaPoolInteraction:
      return "Interact with pool on Solana";
    case StepType.WormholeToSolana:
      return "Bridge tokens to Solana";
    case StepType.WormholeFromSolana:
      return "Bridge tokens from Solana";
    default:
      throw new Error("Step type not recognized");
  }
};

const buildEuiStepProps = (props: StepWithMutation): EuiStepProps | null => {
  switch (props.type) {
    case StepType.CreateSplTokenAccounts:
      if (props.step.mints.length === 0) {
        return null;
      }
      break;
    case StepType.WormholeToSolana:
    case StepType.WormholeFromSolana: {
      const transfers = combineTransfers<Transfer | ProtoTransfer>(
        props.step.transfers,
      );
      if (
        transfers.length === 0 ||
        (props.step.knownAmounts &&
          transfers.every(
            (transfer: Transfer | ProtoTransfer) =>
              // Despite the types saying otherwise, the amount can and has been undefined in the past
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              transfer.amount === undefined ||
              transfer.amount === null ||
              transfer.amount.isZero(),
          ))
      ) {
        return null;
      }
      break;
    }
    default:
      break;
  }
  return {
    title: getStepTitle(props.step),
    status: getEuiStatus(props.step.isComplete, props.mutation),
    children: props.mutation?.isError ? (
      <StepError
        retryInteraction={props.retryInteraction}
        mutation={props.mutation}
      />
    ) : (
      <ActionStep {...props} />
    ),
  };
};

export interface ActionStepsProps {
  readonly retryInteraction: () => any;
  readonly interaction: PoolInteraction;
  readonly steps: Steps;
  readonly status: Status;
  readonly mutations?: StepMutations;
}

export const ActionSteps = ({
  retryInteraction,
  interaction,
  steps,
  status,
  mutations,
}: ActionStepsProps): ReactElement => {
  const stepsWithMutations: readonly StepWithMutation[] = [
    {
      type: steps.createSplTokenAccounts.type,
      step: steps.createSplTokenAccounts,
      retryInteraction: retryInteraction,
      mutation: mutations?.createSplTokenAccounts,
    },
    {
      type: steps.wormholeToSolana.type,
      step: steps.wormholeToSolana,
      retryInteraction: retryInteraction,
      mutation: mutations && {
        ...mutations.wormholeToSolana,
        data: groupTxsByTokenId(mutations.wormholeToSolana.data ?? []),
      },
    },
    {
      type: steps.interactWithPool.type,
      interaction: interaction,
      step: steps.interactWithPool,
      retryInteraction: retryInteraction,
      mutation: mutations?.interactWithPool,
    },
    {
      type: steps.wormholeFromSolana.type,
      step: steps.wormholeFromSolana,
      retryInteraction: retryInteraction,
      mutation: mutations && {
        ...mutations.wormholeFromSolana,
        data: groupTxsByTokenId(mutations.wormholeFromSolana.data ?? []),
      },
    },
  ];
  const euiSteps = stepsWithMutations.map(buildEuiStepProps).filter(isNotNull);
  return (
    <>
      <EuiSteps steps={euiSteps} titleSize="xs" className="actionSteps" />
      {status === Status.Done && (
        <EuiBadge color="success" iconType="check">
          Completed
        </EuiBadge>
      )}
    </>
  );
};
