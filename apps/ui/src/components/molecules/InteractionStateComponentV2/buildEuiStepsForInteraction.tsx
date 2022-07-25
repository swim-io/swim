import type { EuiStepProps, EuiStepStatus } from "@elastic/eui";
import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";

import type { Env } from "../../../config";
import { DEVNET_SWIMUSD, EcosystemId, findTokenById } from "../../../config";
import type {
  AddInteractionState,
  CrossChainEvmSwapInteractionState,
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
  isAddInteractionCompleted,
  isRemoveInteractionCompleted,
  isRequiredSplTokenAccountsCompletedV2,
  isSourceChainOperationCompleted,
  isTargetChainOperationCompleted,
} from "../../../models";
import { isNotNull } from "../../../utils";
import { SwapTransfer } from "../SwapTransfer";
import { Transfer } from "../Transfer";
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
    title: "Prepare Solana accounts",
    status,
    children: (
      <EuiText size="m">
        <span style={{ display: "flex", alignItems: "center" }}>
          {status === "loading" && (
            <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />
          )}
          <span>Create SPL token accounts</span>
        </span>

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
    onChainSwapTxId,
    interaction: {
      params: { fromTokenDetail, toTokenDetail },
    },
  } = interactionState;
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );
  const fromToken = findTokenById(fromTokenDetail.tokenId, env);
  const toToken = findTokenById(toTokenDetail.tokenId, env);

  return {
    title: "Perform pool operation on Solana",
    status,
    children: (
      <SwapTransfer
        ecosystemId={EcosystemId.Solana}
        fromToken={fromToken}
        toToken={toToken}
        isLoading={status === "loading"}
        transactions={[onChainSwapTxId].filter(isNotNull)}
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
    approvalTxIds,
    interaction: {
      params: { fromTokenDetail, toTokenDetail },
    },
  } = interactionState;
  const fromEcosystemId = fromTokenDetail.ecosystemId;
  const fromToken = findTokenById(fromTokenDetail.tokenId, env);
  const toToken = findTokenById(toTokenDetail.tokenId, env);
  const status = getEuiStepStatus(
    interactionStatus,
    isSourceChainOperationCompleted(interactionState),
  );

  return {
    title: "Swap tokens",
    status,
    children: (
      <>
        {approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>Approval transactions</span>

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
          fromToken={fromToken}
          toToken={toToken}
          isLoading={status === "loading"}
          transactions={[interactionState.onChainSwapTxId].filter(isNotNull)}
        />
      </>
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
    isSourceChainOperationCompleted(interactionState),
  );

  return {
    title: "Initiate transfer",
    status,
    children: (
      <>
        {(interactionState.swapType === SwapType.CrossChainEvmToEvm ||
          interactionState.swapType === SwapType.CrossChainEvmToSolana) &&
          interactionState.approvalTxIds.length > 0 && (
            <>
              <EuiText size="m">
                <span>Approval transactions</span>

                <TxEcosystemList
                  transactions={interactionState.approvalTxIds}
                  ecosystemId={fromEcosystemId}
                />
              </EuiText>
              <br />
            </>
          )}
        <SwapTransfer
          ecosystemId={fromEcosystemId}
          fromToken={fromToken}
          toToken={swimUSD}
          isLoading={status === "loading"}
          transactions={[]}
        />
        <Transfer
          from={fromEcosystemId}
          to={toEcosystemId}
          token={swimUSD}
          isLoading={status === "loading"}
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
    isTargetChainOperationCompleted(interactionState),
  );

  return {
    title: "Receive and swap",
    status,
    children: (
      <SwapTransfer
        ecosystemId={toEcosystemId}
        fromToken={swimUSD}
        toToken={toToken}
        isLoading={status === "loading"}
        transactions={[receiveAndSwapTxId].filter(isNotNull)}
      />
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
    isTargetChainOperationCompleted(interactionState),
  );

  return {
    title: "Complete transfer and claim token on Solana",
    status,
    children: (
      <SwapTransfer
        ecosystemId={EcosystemId.Solana}
        fromToken={swimUSD}
        toToken={toToken}
        isLoading={status === "loading"}
        transactions={[...postVaaOnSolanaTxIds, claimTokenOnSolanaTxId].filter(
          isNotNull,
        )}
      />
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
    isRemoveInteractionCompleted(interactionState),
  );

  return {
    title: "Swap LP tokens",
    status,
    children: (
      <>
        {interactionState.approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>Approval transactions</span>

              <TxEcosystemList
                transactions={interactionState.approvalTxIds}
                ecosystemId={lpTokenSourceEcosystem}
              />
            </EuiText>
            <br />
          </>
        )}

        {interaction.type === InteractionType.RemoveUniform && (
          <>
            {interaction.params.minimumOutputAmounts.map((outputAmount) => {
              const { exactBurnAmount } = interaction.params;

              return (
                <SwapTransfer
                  key={outputAmount.tokenId}
                  fromToken={exactBurnAmount.tokenSpec}
                  toToken={outputAmount.tokenSpec}
                  ecosystemId={lpTokenSourceEcosystem}
                  isLoading={status === "loading"}
                  transactions={[]}
                />
              );
            })}
            {removeTxId && (
              <EuiText size="m">
                <TxEcosystemList
                  transactions={[removeTxId]}
                  ecosystemId={lpTokenSourceEcosystem}
                />
              </EuiText>
            )}
          </>
        )}

        {interaction.type === InteractionType.RemoveExactBurn && (
          <>
            <SwapTransfer
              key={interaction.params.minimumOutputAmount.tokenId}
              fromToken={interaction.params.exactBurnAmount.tokenSpec}
              toToken={interaction.params.minimumOutputAmount.tokenSpec}
              ecosystemId={lpTokenSourceEcosystem}
              isLoading={status === "loading"}
              transactions={[removeTxId].filter(isNotNull)}
            />
          </>
        )}

        {interaction.type === InteractionType.RemoveExactOutput && (
          <>
            {interaction.params.exactOutputAmounts.map((outputAmount) => {
              const { maximumBurnAmount } = interaction.params;

              return (
                <SwapTransfer
                  key={outputAmount.tokenId}
                  fromToken={maximumBurnAmount.tokenSpec}
                  toToken={outputAmount.tokenSpec}
                  ecosystemId={lpTokenSourceEcosystem}
                  isLoading={status === "loading"}
                  transactions={[]}
                />
              );
            })}
            {removeTxId && (
              <EuiText size="m">
                <TxEcosystemList
                  transactions={[removeTxId]}
                  ecosystemId={lpTokenSourceEcosystem}
                />
              </EuiText>
            )}
          </>
        )}
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
    isAddInteractionCompleted(interactionState),
  );

  return {
    title: "Swap LP tokens",
    status,
    children: (
      <>
        {interactionState.approvalTxIds.length > 0 && (
          <>
            <EuiText size="m">
              <span>Approval transactions</span>

              <TxEcosystemList
                transactions={interactionState.approvalTxIds}
                ecosystemId={lpTokenTargetEcosystem}
              />
            </EuiText>
            <br />
          </>
        )}

        {interaction.params.inputAmounts.map((inputAmount) => {
          const { minimumMintAmount } = interaction.params;

          return (
            <SwapTransfer
              key={inputAmount.tokenId}
              fromToken={inputAmount.tokenSpec}
              toToken={minimumMintAmount.tokenSpec}
              ecosystemId={minimumMintAmount.tokenSpec.nativeEcosystem}
              isLoading={status === "loading"}
              transactions={[]}
            />
          );
        })}
        {addTxId && (
          <EuiText size="m">
            <TxEcosystemList
              transactions={[addTxId]}
              ecosystemId={lpTokenTargetEcosystem}
            />
          </EuiText>
        )}
      </>
    ),
  };
};

export const buildEuiStepsForInteraction = (
  state: InteractionStateV2,
  status: InteractionStatusV2,
  env: Env,
): readonly EuiStepProps[] => {
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
      return [
        buildPrepareSplTokenAccountStep(state, status),
        buildRemoveStep(state, status),
      ].filter(isNotNull);
    case InteractionType.RemoveExactOutput:
      return [
        buildPrepareSplTokenAccountStep(state, status),
        buildRemoveStep(state, status),
      ].filter(isNotNull);
    case InteractionType.RemoveUniform:
      return [
        buildPrepareSplTokenAccountStep(state, status),
        buildRemoveStep(state, status),
      ].filter(isNotNull);
  }
};
