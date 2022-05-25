import type { EuiStepProps } from "@elastic/eui";
import {
  EuiListGroup,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import moment from "moment";
import type React from "react";

import { EcosystemId } from "../../config";
import type {
  FromSolanaTransferState,
  InteractionState,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  ToSolanaTransferState,
  TokenAccountState,
} from "../../models";
import { isNotNull } from "../../utils";

import { FromSolanaTransferComponent } from "./FromSolanaTransferComponent";
import { InteractionTitle } from "./InteractionTitle";
import { ToSolanaTransferComponent } from "./ToSolanaTransferComponent";
import { TxListItem } from "./TxListItem";

const usePrepareSplTokenAccountsStep = (
  requiredSplTokenAccounts: RequiredSplTokenAccounts,
): EuiStepProps | null => {
  // Add create account step, if there are missing accounts
  const missingAccounts = Object.values(requiredSplTokenAccounts)
    .filter((accountState): accountState is TokenAccountState => !!accountState)
    .filter((accountState) => accountState.existingAccount === false);
  if (missingAccounts.length === 0) {
    return null;
  }
  const status = missingAccounts.every(({ txId }) => isNotNull(txId))
    ? "complete"
    : "incomplete";
  return {
    title: "Prepare Solana accounts",
    status,
    children: (
      <EuiText size="m">
        <span>Create SPL token accounts</span>
        <br />
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {missingAccounts
            .map(({ txId }) => txId)
            .filter(isNotNull)
            .map((txId) => (
              <TxListItem
                key={txId}
                ecosystem={EcosystemId.Solana}
                txId={txId}
              />
            ))}
        </EuiListGroup>
      </EuiText>
    ),
  };
};

const useToSolanaTransfersStep = (
  toSolanaTransfers: readonly ToSolanaTransferState[],
): EuiStepProps | null => {
  if (toSolanaTransfers.length === 0) {
    return null;
  }
  const status = toSolanaTransfers.every((transfer) =>
    isNotNull(transfer.txIds.claimTokenOnSolana),
  )
    ? "complete"
    : "incomplete";
  return {
    title: "Bridge tokens to Solana",
    status,
    children: toSolanaTransfers.map((transfer) => (
      <ToSolanaTransferComponent key={transfer.token.id} transfer={transfer} />
    )),
  };
};

const useSolanaPoolOperationStep = (
  operations: readonly SolanaPoolOperationState[],
): EuiStepProps | null => {
  return {
    title: "Perform pool operation(s) on Solana",
    status: "incomplete",
    children: (
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {operations
          .map(({ txId }) => txId)
          .filter(isNotNull)
          .map((txId) => (
            <TxListItem key={txId} ecosystem={EcosystemId.Solana} txId={txId} />
          ))}
      </EuiListGroup>
    ),
  };
};

const useFromSolanaTransfersStep = (
  fromSolanaTransfers: readonly FromSolanaTransferState[],
): EuiStepProps | null => {
  if (fromSolanaTransfers.length === 0) {
    return null;
  }
  const status = fromSolanaTransfers.every((transfer) =>
    isNotNull(transfer.txIds.claimTokenOnEvm),
  )
    ? "complete"
    : "incomplete";
  return {
    title: "Bridge tokens from Solana",
    status,
    children: fromSolanaTransfers.map((transfer) => (
      <FromSolanaTransferComponent
        key={transfer.token.id}
        transfer={transfer}
      />
    )),
  };
};

const useEuiStepProps = (interactionState: InteractionState) => {
  const {
    requiredSplTokenAccounts,
    toSolanaTransfers,
    solanaPoolOperations,
    fromSolanaTransfers,
  } = interactionState;

  return [
    usePrepareSplTokenAccountsStep(requiredSplTokenAccounts),
    useToSolanaTransfersStep(toSolanaTransfers),
    useSolanaPoolOperationStep(solanaPoolOperations),
    useFromSolanaTransfersStep(fromSolanaTransfers),
  ].filter(isNotNull);
};

interface Props {
  readonly interactionState: InteractionState;
}

export const InteractionStateComponent: React.FC<Props> = ({
  interactionState,
}) => {
  const { interaction } = interactionState;
  const steps = useEuiStepProps(interactionState);
  return (
    <>
      <EuiTitle size="xs">
        <h3>
          <InteractionTitle interaction={interaction} />
        </h3>
      </EuiTitle>
      <EuiText size="s">{moment(interaction.submittedAt).fromNow()}</EuiText>
      <EuiSpacer />
      <EuiSteps titleSize="xs" className="actionSteps" steps={steps} />
    </>
  );
};
