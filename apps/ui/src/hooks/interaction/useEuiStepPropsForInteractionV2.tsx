import type { EuiStepProps, EuiStepStatus } from "@elastic/eui";
import { EuiListGroup, EuiText } from "@elastic/eui";

import { SwapTransfer } from "../../components/molecules/SwapTransfer";
import { Transfer } from "../../components/molecules/Transfer";
import { TxListItem } from "../../components/molecules/TxListItem";
import type { Env } from "../../config";
import { DEVNET_SWIMUSD, EcosystemId, findTokenById } from "../../config";
import { useEnvironment } from "../../core/store";
import { InteractionType } from "../../models";
import type {
  CrossChainEvmSwapInteractionState,
  CrossChainEvmToSolanaSwapInteractionState,
  CrossChainSolanaToEvmSwapInteractionState,
  InteractionStateV2,
  SingleChainEvmSwapInteractionState,
  SingleChainSolanaSwapInteractionState,
} from "../../models/swim/interactionStateV2";
import {
  SwapType,
  isCompleteTransferAndInteractWithPoolOnTargetChainCompleted,
  isInteractWithPoolAndInitiateTransferOnSourceChainCompleted,
  isRequiredSplTokenAccountsCompletedV2,
  isSolanaPoolOperationsCompletedV2,
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

const buildPrepareSplTokenAccountStep = (
  interactionState:
    | SingleChainSolanaSwapInteractionState
    | CrossChainEvmToSolanaSwapInteractionState
    | CrossChainSolanaToEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
): EuiStepProps | null => {
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

const buildSolanaPoolOperationStep = (
  interactionState: SingleChainSolanaSwapInteractionState,
  interactionStatus: InteractionStatusV2,
  env: Env,
): EuiStepProps | null => {
  const {
    solanaPoolOperations,
    interaction: {
      params: { fromTokenDetail, toTokenDetail },
    },
  } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSolanaPoolOperationsCompletedV2(solanaPoolOperations),
  );
  const fromToken = findTokenById(fromTokenDetail.tokenId, env);
  const toToken = findTokenById(toTokenDetail.tokenId, env);

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

const buildEvmPoolOperationStep = (
  interactionState: SingleChainEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
  env: Env,
): EuiStepProps => {
  const {
    interaction: {
      params: { fromTokenDetail, toTokenDetail },
    },
  } = interactionState;
  const fromEcosystemId = fromTokenDetail.ecosystemId;
  const fromToken = findTokenById(fromTokenDetail.tokenId, env);
  const toToken = findTokenById(toTokenDetail.tokenId, env);
  const status = getEuiStepStatus(
    interactionStatus,
    isInteractWithPoolAndInitiateTransferOnSourceChainCompleted(
      interactionState,
    ),
  );

  return {
    title: "Swap tokens",
    status,
    children: (
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {interactionState.approvalTxIds.map((txId) => (
          <TxListItem key={txId} ecosystem={fromEcosystemId} txId={txId} />
        ))}
        <SwapTransfer
          ecosystemId={fromEcosystemId}
          fromToken={fromToken}
          toToken={toToken}
          isLoading={interactionState.onChainSwapTxId === null}
          transactions={[interactionState.onChainSwapTxId].filter(isNotNull)}
        />
      </EuiListGroup>
    ),
  };
};

const buildSwapAndTransferStep = (
  interactionState:
    | CrossChainEvmSwapInteractionState
    | CrossChainEvmToSolanaSwapInteractionState
    | CrossChainSolanaToEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
  env: Env,
): EuiStepProps => {
  const {
    interaction: {
      params: { fromTokenDetail, toTokenDetail },
    },
    swapAndTransferTxId,
  } = interactionState;

  const fromEcosystemId = fromTokenDetail.ecosystemId;
  const fromToken = findTokenById(fromTokenDetail.tokenId, env);
  const toEcosystemId = toTokenDetail.ecosystemId;
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
        <>
          <SwapTransfer
            ecosystemId={fromEcosystemId}
            fromToken={fromToken}
            toToken={swimUSD}
            isLoading={swapAndTransferTxId === null}
            transactions={[]}
          />
          <Transfer
            from={fromEcosystemId}
            to={toEcosystemId}
            token={swimUSD}
            isLoading={swapAndTransferTxId === null}
            transactions={
              swapAndTransferTxId === null
                ? []
                : [
                    {
                      txId: swapAndTransferTxId,
                      ecosystem: fromEcosystemId,
                    },
                  ]
            }
          />
        </>
      </EuiListGroup>
    ),
  };
};

const buildReceiveAndSwapStep = (
  interactionState:
    | CrossChainEvmSwapInteractionState
    | CrossChainSolanaToEvmSwapInteractionState,
  interactionStatus: InteractionStatusV2,
  env: Env,
): EuiStepProps => {
  const {
    interaction: {
      params: { toTokenDetail },
    },
    receiveAndSwapTxId,
  } = interactionState;
  const toEcosystemId = toTokenDetail.ecosystemId;
  const toToken = findTokenById(toTokenDetail.tokenId, env);
  const swimUSD = DEVNET_SWIMUSD; // TODO find swimUSD for each env
  const status = getEuiStepStatus(
    interactionStatus,
    isCompleteTransferAndInteractWithPoolOnTargetChainCompleted(
      interactionState,
    ),
  );

  return {
    title: "Receive and swap",
    status,
    children: (
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        <SwapTransfer
          ecosystemId={toEcosystemId}
          fromToken={swimUSD}
          toToken={toToken}
          isLoading={receiveAndSwapTxId === null}
          transactions={[receiveAndSwapTxId].filter(isNotNull)}
        />
      </EuiListGroup>
    ),
  };
};

const buildPostVaaAndClaimToken = (
  interactionState: CrossChainEvmToSolanaSwapInteractionState,
  interactionStatus: InteractionStatusV2,
  env: Env,
): EuiStepProps => {
  const {
    claimTokenOnSolanaTxId,
    postVaaOnSolanaTxIds,
    interaction: {
      params: { toTokenDetail },
    },
  } = interactionState;
  const toToken = findTokenById(toTokenDetail.tokenId, env);

  const swimUSD = DEVNET_SWIMUSD; // TODO find swimUSD for each env

  const status = getEuiStepStatus(
    interactionStatus,
    isCompleteTransferAndInteractWithPoolOnTargetChainCompleted(
      interactionState,
    ),
  );

  return {
    title: "Complete transfer and clain token on Solana",
    status,
    children: (
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        <SwapTransfer
          ecosystemId={EcosystemId.Solana}
          fromToken={swimUSD}
          toToken={toToken}
          isLoading={claimTokenOnSolanaTxId === null}
          transactions={[
            ...postVaaOnSolanaTxIds,
            claimTokenOnSolanaTxId,
          ].filter(isNotNull)}
        />
      </EuiListGroup>
    ),
  };
};

export const useEuiStepPropsForInteractionV2 = (
  state: InteractionStateV2,
): readonly EuiStepProps[] => {
  const { env } = useEnvironment();
  const status = useInteractionStatusV2(state);

  switch (state.interactionType) {
    case InteractionType.SwapV2: {
      switch (state.swapType) {
        case SwapType.SingleChainSolana: {
          return [
            buildPrepareSplTokenAccountStep(state, status),
            buildSolanaPoolOperationStep(state, status, env),
          ].filter(isNotNull);
        }
        case SwapType.SingleChainEvm: {
          return [buildEvmPoolOperationStep(state, status, env)];
        }
        case SwapType.CrossChainEvmToEvm: {
          return [
            buildSwapAndTransferStep(state, status, env),
            buildReceiveAndSwapStep(state, status, env),
          ];
        }
        case SwapType.CrossChainEvmToSolana: {
          return [
            buildPrepareSplTokenAccountStep(state, status),
            buildSwapAndTransferStep(state, status, env),
            buildPostVaaAndClaimToken(state, status, env),
          ].filter(isNotNull);
        }
        case SwapType.CrossChainSolanaToEvm: {
          return [
            buildPrepareSplTokenAccountStep(state, status),
            buildSwapAndTransferStep(state, status, env),
            buildReceiveAndSwapStep(state, status, env),
          ].filter(isNotNull);
        }
      }
      break; // unreachable but eslint complains otherwise... nested switch eslint bug?
    }
    case InteractionType.Add:
      return [];
    case InteractionType.RemoveExactBurn:
      return [];
    case InteractionType.RemoveExactOutput:
      return [];
    case InteractionType.RemoveUniform:
      return [];
  }
};
