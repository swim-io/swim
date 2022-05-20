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
  Interaction,
  ProtoTransfer,
  SolanaOperationsStep,
  Step,
  Steps,
  Transfer,
  Tx,
  TxWithPoolId,
  TxsByTokenId,
  WormholeFromSolanaStep,
  WormholeToSolanaStep,
} from "../models";
import {
  InteractionType,
  Status,
  StepType,
  combineTransfers,
  groupTxsByTokenId,
} from "../models";
import type { ReadonlyRecord } from "../utils";
import { isNotNull } from "../utils";

import { TxListItem } from "./molecules/TxListItem";

import "./StepsDisplay.scss";

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
      readonly type: StepType.SolanaOperations;
      readonly interaction: Interaction;
      readonly step: SolanaOperationsStep;
      readonly retryInteraction: () => any;
      readonly mutation?: Mutation<{ readonly txs: readonly TxWithPoolId[] }>;
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

interface SubStepDisplayProps {
  readonly transfer: ProtoTransfer | Transfer;
  readonly isComplete: boolean;
  readonly txs: readonly Tx[] | null;
  readonly mutation?: Mutation<any>;
}

const SubStepDisplay = ({
  transfer,
  isComplete,
  txs,
  mutation,
}: SubStepDisplayProps): ReactElement => {
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
      {txs !== null && (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {txs.map((tx) => (
            <TxListItem key={tx.txId} {...tx} />
          ))}
        </EuiListGroup>
      )}
    </>
  );
};

interface CreateSplTokenAccountsStepDisplayProps {
  readonly step: CreateSplTokenAccountsStep;
  readonly mutation?: Mutation<readonly TokenAccountInfo[]>;
}

const CreateSplTokenAccountsStepDisplay = ({
  step,
  mutation,
}: CreateSplTokenAccountsStepDisplayProps): ReactElement => {
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

interface WormholeStepDisplayProps {
  readonly step: WormholeToSolanaStep | WormholeFromSolanaStep;
  readonly mutation?: Mutation<TxsByTokenId>;
}

const doTransfersInvolveEcosystem = (
  transfers: readonly (Transfer | ProtoTransfer)[],
  ecosystem: EcosystemId,
): boolean =>
  transfers.some(
    (transfer: ProtoTransfer | Transfer) =>
      transfer.fromEcosystem === ecosystem ||
      transfer.toEcosystem === ecosystem,
  );

const WormholeStepDisplay = ({
  step,
  mutation,
}: WormholeStepDisplayProps): ReactElement => {
  const transfers = combineTransfers<Transfer | ProtoTransfer>(step.transfers);
  const involvesEthereum = doTransfersInvolveEcosystem(
    transfers,
    EcosystemId.Ethereum,
  );
  const involvesPolygon = doTransfersInvolveEcosystem(
    transfers,
    EcosystemId.Polygon,
  );
  return (
    <>
      {mutation?.isLoading && involvesEthereum && (
        <>
          <EuiCallOut
            size="s"
            title="Please note that waiting for Ethereum block confirmations may take a few minutes."
            iconType="clock"
          />
          <EuiSpacer size="s" />
        </>
      )}
      {mutation?.isLoading && involvesPolygon && (
        <>
          <EuiCallOut
            size="s"
            title="Please note that waiting for Polygon block confirmations may take a long time. Finality requires 512 confirmations or about 18 minutes."
            iconType="clock"
          />
          <EuiSpacer size="s" />
        </>
      )}

      {transfers.map(
        (transfer: ProtoTransfer | Transfer): ReactElement => (
          <SubStepDisplay
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

const solanaOperationsStepTitles: ReadonlyRecord<InteractionType, string> = {
  [InteractionType.Add]: "Add tokens",
  [InteractionType.Swap]: "Swap tokens",
  [InteractionType.RemoveUniform]: "Remove tokens",
  [InteractionType.RemoveExactBurn]: "Remove tokens",
  [InteractionType.RemoveExactOutput]: "Remove tokens",
};

interface SolanaOperationsStepDisplayProps {
  readonly step: SolanaOperationsStep;
  readonly interaction: Interaction;
  readonly mutation?: Mutation<{ readonly txs: readonly TxWithPoolId[] }>;
}

const SolanaOperationsStepDisplay = ({
  interaction,
  step,
  mutation,
}: SolanaOperationsStepDisplayProps): ReactElement => {
  const { txs } = step;
  const txsList = interaction.poolIds.flatMap((poolId) => txs[poolId] ?? []);
  return (
    <>
      <MutationStatus
        title={solanaOperationsStepTitles[interaction.type]}
        isComplete={step.isComplete}
        mutation={mutation}
      />
      {txsList.length > 0 && (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {txsList.map((tx) => (
            <TxListItem key={tx.txId} {...tx} />
          ))}
        </EuiListGroup>
      )}
    </>
  );
};

const StepDisplay = (props: StepWithMutation): ReactElement => {
  switch (props.type) {
    case StepType.CreateSplTokenAccounts:
      return <CreateSplTokenAccountsStepDisplay {...props} />;
    case StepType.WormholeToSolana:
      return <WormholeStepDisplay {...props} />;
    case StepType.SolanaOperations:
      return <SolanaOperationsStepDisplay {...props} />;
    case StepType.WormholeFromSolana:
      return <WormholeStepDisplay {...props} />;
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
    case StepType.SolanaOperations:
      return "Perform pool operation(s) on Solana";
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
      <StepDisplay {...props} />
    ),
  };
};

export interface StepsProps {
  readonly retryInteraction: () => any;
  readonly interaction: Interaction;
  readonly steps: Steps;
  readonly status: Status;
  readonly mutations?: StepMutations;
}

export const StepsDisplay = ({
  retryInteraction,
  interaction,
  steps,
  status,
  mutations,
}: StepsProps): ReactElement => {
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
      type: steps.doPoolOperations.type,
      interaction: interaction,
      step: steps.doPoolOperations,
      retryInteraction: retryInteraction,
      mutation: mutations && {
        ...mutations.doPoolOperations,
        data: {
          txs: mutations.doPoolOperations.data ?? [],
        },
      },
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
