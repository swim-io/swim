import type { EuiStepProps, EuiStepStatus } from "@elastic/eui";
import { EuiListGroup, EuiText } from "@elastic/eui";

import { SwapTransfer } from "../../components/molecules/SwapTransfer";
import { Transfer } from "../../components/molecules/Transfer";
import { TxListItem } from "../../components/molecules/TxListItem";
import { DEVNET_SWIMUSD, EcosystemId, findTokenById } from "../../config";
import { useEnvironment } from "../../core/store";
import type { InteractionStateV2 } from "../../models/swim/interactionStateV2";
import {
  SwapType,
  isCompleteTransferAndInteractWithPoolOnTargetChainCompleted,
  isInteractWithPoolAndInitiateTransferOnSourceChainCompleted,
  isRequiredSplTokenAccountsCompletedV2,
  isSolanaPoolOperationsCompletedV2,
  isSwapInteractionStateV2,
} from "../../models/swim/interactionStateV2";
import { isNotNull } from "../../utils";

import {
  InteractionStatusV2,
  useInteractionStatusV2,
} from "./useInteractionStatusV2";

const getEuiStepStatus = (
  interactionStatus: InteractionStatusV2,
  isStepCompleted: boolean,
): EuiStepStatus => {
  if (interactionStatus === InteractionStatusV2.Completed) {
    return "complete";
  }
  if (isStepCompleted) {
    return "complete";
  } else if (interactionStatus === InteractionStatusV2.Active) {
    return "loading";
  }
  // interaction is inactive or incomplete
  return "incomplete";
};

const usePrepareSplTokenAccountsStep = (
  interactionState: InteractionStateV2,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatusV2(interactionState);

  if (!("requiredSplTokenAccounts" in interactionState)) return null;

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
    isRequiredSplTokenAccountsCompletedV2(requiredSplTokenAccounts),
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
                ecosystem={EcosystemId.Solana}
                txId={txId}
              />
            ))}
        </EuiListGroup>
      </EuiText>
    ),
  };
};

const useSolanaPoolOperationStep = (
  interactionState: InteractionStateV2,
): EuiStepProps | null => {
  const { env } = useEnvironment();
  const interactionStatus = useInteractionStatusV2(interactionState);

  if (!("solanaPoolOperations" in interactionState)) return null;

  const { solanaPoolOperations, interaction } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSolanaPoolOperationsCompletedV2(solanaPoolOperations),
  );

  const fromToken = findTokenById(
    interaction.params.fromTokenDetail.tokenId,
    env,
  );
  const toToken = findTokenById(interaction.params.toTokenDetail.tokenId, env);

  return {
    title: "Perform pool operation(s) on Solana",
    status,
    children: (
      <SwapTransfer
        ecosystemId={EcosystemId.Solana}
        fromToken={fromToken}
        toToken={toToken}
        isLoading={status === "loading"}
        transactions={solanaPoolOperations
          .map(({ txId }) => txId)
          .filter(isNotNull)}
      />
    ),
  };
};

const useInteractWithPoolAndInitiateTransferOnSourceChainStep = (
  interactionState: InteractionStateV2,
): EuiStepProps | null => {
  const { env } = useEnvironment();
  const interactionStatus = useInteractionStatusV2(interactionState);

  if (isSwapInteractionStateV2(interactionState)) {
    // this is handled in useSolanaPoolOperationStep
    if (interactionState.swapType === SwapType.SingleChainSolana) return null;

    const { interaction } = interactionState;

    const fromEcosystemId = interaction.params.fromTokenDetail.ecosystemId;
    const fromToken = findTokenById(
      interaction.params.fromTokenDetail.tokenId,
      env,
    );
    const toEcosystemId = interaction.params.toTokenDetail.ecosystemId;
    const toToken = findTokenById(
      interaction.params.toTokenDetail.tokenId,
      env,
    );
    const swimUSD = DEVNET_SWIMUSD; // TODO find swimUSD for each env

    const status = getEuiStepStatus(
      interactionStatus,
      isInteractWithPoolAndInitiateTransferOnSourceChainCompleted(
        interactionState,
      ),
    );

    return {
      title: "Initiate transfer",
      status,
      children: (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {"approvalTxIds" in interactionState &&
            interactionState.approvalTxIds.map((txId) => (
              <TxListItem key={txId} ecosystem={fromEcosystemId} txId={txId} />
            ))}
          {"onChainSwapTxId" in interactionState && (
            <SwapTransfer
              ecosystemId={fromEcosystemId}
              fromToken={fromToken}
              toToken={toToken}
              isLoading={interactionState.onChainSwapTxId === null}
              transactions={[interactionState.onChainSwapTxId].filter(
                isNotNull,
              )}
            />
          )}
          {"swapAndTransferTxId" in interactionState && (
            <>
              <SwapTransfer
                ecosystemId={fromEcosystemId}
                fromToken={fromToken}
                toToken={swimUSD}
                isLoading={interactionState.swapAndTransferTxId === null}
                transactions={[]}
              />
              <Transfer
                from={fromEcosystemId}
                to={toEcosystemId}
                token={swimUSD}
                isLoading={interactionState.swapAndTransferTxId === null}
                transactions={
                  interactionState.swapAndTransferTxId === null
                    ? []
                    : [
                        {
                          txId: interactionState.swapAndTransferTxId,
                          ecosystem: fromEcosystemId,
                        },
                      ]
                }
              />
            </>
          )}
        </EuiListGroup>
      ),
    };
  }

  throw new Error(
    `Interaction type ${interactionState.interaction.type} is not implemented`,
  );
};

const useCompleteTransferAndInteractWithPoolOnTargetChainStep = (
  interactionState: InteractionStateV2,
): EuiStepProps | null => {
  const interactionStatus = useInteractionStatusV2(interactionState);
  const { env } = useEnvironment();

  if (isSwapInteractionStateV2(interactionState)) {
    // Single chain swaps don't have this step
    if (
      [SwapType.SingleChainSolana, SwapType.SingleChainEvm].includes(
        interactionState.swapType,
      )
    )
      return null;

    const { interaction } = interactionState;

    const toEcosystemId = interaction.params.toTokenDetail.ecosystemId;
    const toToken = findTokenById(
      interaction.params.toTokenDetail.tokenId,
      env,
    );

    const swimUSD = DEVNET_SWIMUSD; // TODO find swimUSD for each env

    const status = getEuiStepStatus(
      interactionStatus,
      isCompleteTransferAndInteractWithPoolOnTargetChainCompleted(
        interactionState,
      ),
    );

    return {
      title: "Complete transfer",
      status,
      children: (
        <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
          {"receiveAndSwapTxId" in interactionState && (
            <SwapTransfer
              ecosystemId={toEcosystemId}
              fromToken={swimUSD}
              toToken={toToken}
              isLoading={interactionState.receiveAndSwapTxId === null}
              transactions={[interactionState.receiveAndSwapTxId].filter(
                isNotNull,
              )}
            />
          )}
          {"claimTokenOnSolanaTxId" in interactionState && (
            <SwapTransfer
              ecosystemId={EcosystemId.Solana}
              fromToken={swimUSD}
              toToken={toToken}
              isLoading={interactionState.claimTokenOnSolanaTxId === null}
              transactions={[
                ...interactionState.postVaaOnSolanaTxIds,
                interactionState.claimTokenOnSolanaTxId,
              ].filter(isNotNull)}
            />
          )}
        </EuiListGroup>
      ),
    };
  }

  throw new Error(
    `Interaction type ${interactionState.interaction.type} is not implemented`,
  );
};

export const useEuiStepPropsForInteractionV2 = (
  interactionState: InteractionStateV2,
): readonly EuiStepProps[] => {
  return [
    usePrepareSplTokenAccountsStep(interactionState),
    useSolanaPoolOperationStep(interactionState),
    useInteractWithPoolAndInitiateTransferOnSourceChainStep(interactionState),
    useCompleteTransferAndInteractWithPoolOnTargetChainStep(interactionState),
  ].filter(isNotNull);
};
