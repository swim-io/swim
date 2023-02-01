import type { EuiStepProps, EuiStepStatus } from "@elastic/eui";
import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isNotNull } from "@swim-io/utils";

import { isSwimUsd } from "../../../config";
import { i18next } from "../../../i18n";
import type {
  AddInteractionState,
  CrossChainEvmToEvmSwapInteractionState,
  CrossChainEvmToSolanaSwapInteractionState,
  CrossChainSolanaToEvmSwapInteractionState,
  InteractionStateV2,
  RemoveInteractionState,
  SingleChainEvmSwapInteractionState,
  SingleChainSolanaSwapInteractionState,
} from "../../../models";
import {
  InteractionStatusV2,
  InteractionType,
  SwapType,
  isInteractionCompletedV2,
  isRequiredSplTokenAccountsCompletedV2,
  isSourceChainOperationCompleted,
  isTargetChainOperationCompleted,
} from "../../../models";
import { AddTransfer } from "../AddTransfer";
import { ClaimTokenOnSolana } from "../ClaimTokenOnSolana";
import { RemoveTransfer } from "../RemoveTransfer";
import { SwapFromSwimUsd } from "../SwapFromSwimUsd";
import { SwapToSwimUsd } from "../SwapToSwimUsd";
import { SwapTransfer } from "../SwapTransfer";
import { TransferSwimUsd } from "../TransferSwimUsd";
import { TxEcosystemList } from "../TxList";
import { TxListItem } from "../TxListItem";

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

const buildPrepareSplTokenAccountStep = (
  interactionState:
    | SingleChainSolanaSwapInteractionState
    | CrossChainEvmToSolanaSwapInteractionState
    | CrossChainSolanaToEvmSwapInteractionState
    | AddInteractionState
    | RemoveInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps | null => {
  const { requiredSplTokenAccounts } = interactionState;

  if (requiredSplTokenAccounts === null) return null;

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
    title: i18next.t("recent_interactions.prepare_solana_accounts_title"),
    status,
    children: (
      <EuiText size="m">
        <span style={{ display: "flex", alignItems: "center" }}>
          {status === "loading" && (
            <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />
          )}
          <span>
            {i18next.t(
              "recent_interactions.prepare_solana_accounts_create_step",
            )}
          </span>
        </span>
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

const buildSolanaPoolOperationStep = (
  interactionState: SingleChainSolanaSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps | null => {
  const {
    onChainSwapTxId,
    interaction: {
      params: { fromTokenData, toTokenData },
    },
  } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );
  return {
    title: i18next.t("recent_interactions.perform_pool_operation_on_solana"),
    status,
    children: (
      <SwapTransfer
        ecosystemId={SOLANA_ECOSYSTEM_ID}
        fromToken={fromTokenData.tokenConfig}
        toToken={toTokenData.tokenConfig}
        isLoading={status === "loading"}
        transactions={[onChainSwapTxId].filter(isNotNull)}
      />
    ),
  };
};

const buildEvmPoolOperationStep = (
  interactionState: SingleChainEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const {
    approvalTxIds,
    interaction: {
      params: { fromTokenData, toTokenData },
    },
  } = interactionState;
  const fromEcosystemId = fromTokenData.ecosystemId;
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );
  return {
    title: i18next.t("recent_interactions.swap_tokens"),
    status,
    children: (
      <>
        {approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>
                {i18next.t("recent_interactions.approval_transactions")}
              </span>
              <TxEcosystemList
                transactions={approvalTxIds}
                ecosystemId={fromEcosystemId}
              />
            </EuiText>
            <br />
          </>
        )}
        <SwapTransfer
          ecosystemId={fromEcosystemId}
          fromToken={fromTokenData.tokenConfig}
          toToken={toTokenData.tokenConfig}
          isLoading={status === "loading"}
          transactions={[interactionState.onChainSwapTxId].filter(isNotNull)}
        />
      </>
    ),
  };
};

const buildTransferSwimUsdToEvmStep = (
  interactionState: CrossChainSolanaToEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const {
    interaction: {
      params: { fromTokenData, toTokenData },
    },
    swapToSwimUsdTxId,
    transferSwimUsdToEvmTxId,
  } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );
  return {
    title: i18next.t("recent_interactions.initiate_transfer"),
    status,
    children: (
      <>
        {!isSwimUsd(fromTokenData.tokenConfig) && (
          <SwapToSwimUsd
            ecosystemId={fromTokenData.ecosystemId}
            fromToken={fromTokenData.tokenConfig}
            isLoading={status === "loading" && swapToSwimUsdTxId === null}
            txId={swapToSwimUsdTxId}
          />
        )}
        <TransferSwimUsd
          from={fromTokenData.ecosystemId}
          to={toTokenData.ecosystemId}
          isLoading={status === "loading"}
          txId={transferSwimUsdToEvmTxId}
        />
      </>
    ),
  };
};

const buildSwapAndTransferStep = (
  interactionState:
    | CrossChainEvmToEvmSwapInteractionState
    | CrossChainEvmToSolanaSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const {
    interaction: {
      params: { fromTokenData, toTokenData },
    },
    crossChainInitiateTxId,
  } = interactionState;

  const fromEcosystemId = fromTokenData.ecosystemId;
  const toEcosystemId = toTokenData.ecosystemId;
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );
  return {
    title: i18next.t("recent_interactions.initiate_transfer"),
    status,
    children: (
      <>
        {interactionState.approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>
                {i18next.t("recent_interactions.approval_transactions")}
              </span>
              <TxEcosystemList
                transactions={interactionState.approvalTxIds}
                ecosystemId={fromEcosystemId}
              />
            </EuiText>
            <br />
          </>
        )}
        <SwapToSwimUsd
          ecosystemId={fromEcosystemId}
          fromToken={fromTokenData.tokenConfig}
          isLoading={status === "loading"}
          txId={null}
        />
        <TransferSwimUsd
          from={fromEcosystemId}
          to={toEcosystemId}
          isLoading={status === "loading"}
          txId={crossChainInitiateTxId}
        />
      </>
    ),
  };
};

const buildReceiveAndSwapStep = (
  interactionState:
    | CrossChainEvmToEvmSwapInteractionState
    | CrossChainSolanaToEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const {
    interaction: {
      params: { toTokenData },
    },
    crossChainCompleteTxId,
  } = interactionState;
  const toEcosystemId = toTokenData.ecosystemId;
  const status = getEuiStepStatus(
    interactionStatus,
    isTargetChainOperationCompleted(interactionState),
  );

  return {
    title: i18next.t("recent_interactions.receive_and_swap"),
    status,
    children: (
      <SwapFromSwimUsd
        ecosystemId={toEcosystemId}
        toToken={toTokenData.tokenConfig}
        isLoading={status === "loading"}
        txId={crossChainCompleteTxId}
      />
    ),
  };
};

const buildClaimTokenOnSolanaStep = (
  interactionState: CrossChainEvmToSolanaSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const {
    verifySignaturesTxIds,
    postVaaOnSolanaTxId,
    completeNativeWithPayloadTxId,
    processSwimPayloadTxId,
    interaction: {
      params: { toTokenData },
    },
  } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isTargetChainOperationCompleted(interactionState),
  );

  return {
    title: i18next.t(
      "recent_interactions.complete_transfer_and_claim_token_on_solana",
    ),
    status,
    children: (
      <>
        <ClaimTokenOnSolana
          isLoading={status === "loading"}
          tokenConfig={toTokenData.tokenConfig}
          transactions={[
            ...verifySignaturesTxIds,
            postVaaOnSolanaTxId,
            completeNativeWithPayloadTxId,
            processSwimPayloadTxId,
          ].filter(isNotNull)}
        />
      </>
    ),
  };
};

const buildRemoveStep = (
  interactionState: RemoveInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const { interaction, removeTxId } = interactionState;
  const { lpTokenSourceEcosystem } = interaction;
  const status = getEuiStepStatus(
    interactionStatus,
    isInteractionCompletedV2(interactionState),
  );

  const fromToken = (() => {
    switch (interaction.type) {
      case InteractionType.RemoveUniform:
      case InteractionType.RemoveExactBurn:
        return interaction.params.exactBurnAmount.tokenConfig;
      case InteractionType.RemoveExactOutput:
        return interaction.params.maximumBurnAmount.tokenConfig;
    }
  })();
  const outputAmounts = (() => {
    switch (interaction.type) {
      case InteractionType.RemoveUniform:
        return interaction.params.minimumOutputAmounts;
      case InteractionType.RemoveExactBurn:
        return [interaction.params.minimumOutputAmount];
      case InteractionType.RemoveExactOutput:
        return interaction.params.exactOutputAmounts;
    }
  })();

  return {
    title: i18next.t("recent_interactions.remove_liquidity"),
    status,
    children: (
      <>
        {interactionState.approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>
                {i18next.t("recent_interactions.approval_transactions")}
              </span>

              <TxEcosystemList
                transactions={interactionState.approvalTxIds}
                ecosystemId={lpTokenSourceEcosystem}
              />
            </EuiText>
            <br />
          </>
        )}
        <RemoveTransfer
          fromToken={fromToken}
          toAmounts={outputAmounts}
          ecosystemId={fromToken.nativeEcosystemId}
          isLoading={status === "loading"}
          transaction={removeTxId}
        />
      </>
    ),
  };
};

const buildAddStep = (
  interactionState: AddInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps => {
  const { interaction, addTxId } = interactionState;
  const { lpTokenTargetEcosystem } = interaction;
  const status = getEuiStepStatus(
    interactionStatus,
    isInteractionCompletedV2(interactionState),
  );
  const { inputAmounts, minimumMintAmount } = interaction.params;
  return {
    title: i18next.t("recent_interactions.add_liquidity"),
    status,
    children: (
      <>
        {interactionState.approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>
                {i18next.t("recent_interactions.approval_transactions")}
              </span>

              <TxEcosystemList
                transactions={interactionState.approvalTxIds}
                ecosystemId={lpTokenTargetEcosystem}
              />
            </EuiText>
            <br />
          </>
        )}
        <AddTransfer
          fromAmounts={inputAmounts}
          toToken={minimumMintAmount.tokenConfig}
          ecosystemId={minimumMintAmount.tokenConfig.nativeEcosystemId}
          isLoading={status === "loading"}
          transaction={addTxId}
        />
      </>
    ),
  };
};

export const buildEuiStepsForInteraction = (
  state: InteractionStateV2,
  status: InteractionStatusV2,
): readonly EuiStepProps[] => {
  switch (state.interactionType) {
    case InteractionType.SwapV2: {
      switch (state.swapType) {
        case SwapType.SingleChainSolana: {
          return [
            buildPrepareSplTokenAccountStep(state, status),
            buildSolanaPoolOperationStep(state, status),
          ].filter(isNotNull);
        }
        case SwapType.SingleChainEvm: {
          return [buildEvmPoolOperationStep(state, status)];
        }
        case SwapType.CrossChainEvmToEvm: {
          return [
            buildSwapAndTransferStep(state, status),
            buildReceiveAndSwapStep(state, status),
          ];
        }
        case SwapType.CrossChainEvmToSolana: {
          return [
            buildSwapAndTransferStep(state, status),
            buildPrepareSplTokenAccountStep(state, status),
            buildClaimTokenOnSolanaStep(state, status),
          ].filter(isNotNull);
        }
        case SwapType.CrossChainSolanaToEvm: {
          return [
            buildPrepareSplTokenAccountStep(state, status),
            buildTransferSwimUsdToEvmStep(state, status),
            buildReceiveAndSwapStep(state, status),
          ].filter(isNotNull);
        }
        default: {
          throw new Error("New SwapType found");
        }
      }
    }
    case InteractionType.Add:
      return [
        buildPrepareSplTokenAccountStep(state, status),
        buildAddStep(state, status),
      ].filter(isNotNull);
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput:
    case InteractionType.RemoveUniform:
      return [
        buildPrepareSplTokenAccountStep(state, status),
        buildRemoveStep(state, status),
      ].filter(isNotNull);
  }
};
