import type { EuiStepProps, EuiStepStatus } from "@elastic/eui";
import { EuiListGroup, EuiText } from "@elastic/eui";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

import { FromSolanaTransferComponent } from "../../components/molecules/FromSolanaTransferComponent";
import { ToSolanaTransferComponent } from "../../components/molecules/ToSolanaTransferComponent";
import { TxListItem } from "../../components/molecules/TxListItem";
import { WaitForEcosystemCallout } from "../../components/molecules/WaitForEcosystemCallout";
import type { InteractionState } from "../../models";
import {
  InteractionStateStep,
  getNextTxInfo,
  isFromSolanaTransfersCompleted,
  isRequiredSplTokenAccountsCompleted,
  isSolanaPoolOperationsCompleted,
  isToSolanaTransfersCompleted,
} from "../../models";
import { isNotNull } from "../../utils";

import {
  InteractionStatus,
  useInteractionStatus,
} from "./useInteractionStatus";

const getEuiStepStatus = (
  interactionStatus: InteractionStatus,
  isStepCompleted: boolean,
): EuiStepStatus => {
  if (interactionStatus === InteractionStatus.Completed) {
    return "complete";
  }
  if (isStepCompleted) {
    return "complete";
  } else if (interactionStatus === InteractionStatus.Active) {
    return "loading";
  }
  // interaction is inactive or incomplete
  return "incomplete";
};

const usePrepareSplTokenAccountsStep = (
  interactionState: InteractionState,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatus(interactionState);
  const { requiredSplTokenAccounts } = interactionState;

  // Add create account step, if there are missing accounts
  const missingAccounts = Object.values(requiredSplTokenAccounts).filter(
    (accountState) => accountState.isExistingAccount === false,
  );
  if (missingAccounts.length === 0) {
    return null;
  }
  const status = getEuiStepStatus(
    interactionStatus,
    isRequiredSplTokenAccountsCompleted(requiredSplTokenAccounts),
  );
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
                ecosystem={SOLANA_ECOSYSTEM_ID}
                txId={txId}
              />
            ))}
        </EuiListGroup>
      </EuiText>
    ),
  };
};

const useToSolanaTransfersStep = (
  interactionState: InteractionState,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatus(interactionState);
  const { toSolanaTransfers } = interactionState;

  if (toSolanaTransfers.length === 0) {
    return null;
  }
  const status = getEuiStepStatus(
    interactionStatus,
    isToSolanaTransfersCompleted(toSolanaTransfers),
  );
  const nextTxInfo = getNextTxInfo(interactionState);
  const shouldShowEcosystemCallout =
    interactionStatus === InteractionStatus.Active &&
    nextTxInfo !== null &&
    nextTxInfo.step === InteractionStateStep.ToSolanaTransfers;
  return {
    title: "Bridge tokens to Solana",
    status,
    children: (
      <>
        {shouldShowEcosystemCallout && (
          <WaitForEcosystemCallout ecosystemId={nextTxInfo.ecosystem} />
        )}
        {toSolanaTransfers.map((transfer) => (
          <ToSolanaTransferComponent
            key={transfer.token.id}
            interaction={interactionState.interaction}
            transfer={transfer}
            isInteractionActive={interactionStatus === InteractionStatus.Active}
          />
        ))}
      </>
    ),
  };
};

const useSolanaPoolOperationStep = (
  interactionState: InteractionState,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatus(interactionState);
  const { solanaPoolOperations } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSolanaPoolOperationsCompleted(solanaPoolOperations),
  );
  return {
    title: "Perform pool operation(s) on Solana",
    status,
    children: (
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {solanaPoolOperations
          .map(({ txId }) => txId)
          .filter(isNotNull)
          .map((txId) => (
            <TxListItem key={txId} ecosystem={SOLANA_ECOSYSTEM_ID} txId={txId} />
          ))}
      </EuiListGroup>
    ),
  };
};

const useFromSolanaTransfersStep = (
  interactionState: InteractionState,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatus(interactionState);
  const { fromSolanaTransfers } = interactionState;
  if (fromSolanaTransfers.length === 0) {
    return null;
  }
  const status = getEuiStepStatus(
    interactionStatus,
    isFromSolanaTransfersCompleted(fromSolanaTransfers),
  );
  const nextTxInfo = getNextTxInfo(interactionState);
  const shouldShowEcosystemCallout =
    interactionStatus === InteractionStatus.Active &&
    nextTxInfo !== null &&
    nextTxInfo.step === InteractionStateStep.FromSolanaTransfers;
  return {
    title: "Bridge tokens from Solana",
    status,
    children: (
      <>
        {shouldShowEcosystemCallout && (
          <WaitForEcosystemCallout ecosystemId={nextTxInfo.ecosystem} />
        )}
        {fromSolanaTransfers.map((transfer) => (
          <FromSolanaTransferComponent
            key={transfer.token.id}
            interaction={interactionState.interaction}
            transfer={transfer}
            isInteractionActive={interactionStatus === InteractionStatus.Active}
          />
        ))}
      </>
    ),
  };
};

export const useEuiStepPropsForInteraction = (
  interactionState: InteractionState,
): readonly EuiStepProps[] => {
  return [
    usePrepareSplTokenAccountsStep(interactionState),
    useToSolanaTransfersStep(interactionState),
    useSolanaPoolOperationStep(interactionState),
    useFromSolanaTransfersStep(interactionState),
  ].filter(isNotNull);
};
