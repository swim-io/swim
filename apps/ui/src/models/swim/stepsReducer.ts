import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import type { Keypair } from "@solana/web3.js";
import Decimal from "decimal.js";

import type {
  Config,
  EvmSpec,
  PoolSpec,
  SolanaSpec,
  TokenSpec,
  WormholeChainSpec,
} from "../../config";
import { EcosystemId, Protocol, getSolanaTokenDetails } from "../../config";
import type { SwimError } from "../../errors";
import type { ReadonlyRecord } from "../../utils";
import { findOrThrow } from "../../utils";
import { Amount } from "../amount";
import type { SolanaTx, Tx, TxsByTokenId } from "../crossEcosystem";
import {
  deduplicateTxs,
  deduplicateTxsByTokenId,
  isSolanaTx,
} from "../crossEcosystem";
import {
  findTokenAccountForMint,
  getAmountMintedToAccountByMint,
  getAmountTransferredToAccountByMint,
} from "../solana";

import type { Interaction } from "./interaction";
import type { TokensByPoolId } from "./pool";
import { getTokensByPool } from "./pool";
import type { Steps, WormholeFromSolanaFullStep } from "./steps";
import { createSteps, getRequiredPools } from "./steps";
import type { ProtoTransfer, Transfer, Transfers } from "./transfer";
import {
  TransferType,
  didAllTransfersComplete,
  didTransferFromSolanaComplete,
  didTransferToSolanaComplete,
  updateTransfersWithNewSignatureSetKeypairs,
} from "./transfer";
import { getSignatureSetAddresses } from "./utils";

export const enum Status {
  Initial,
  Initiated,
  CreatedSplTokenAccounts,
  TransferredToSolana,
  CompletedPoolOperations,
  Done,
  Error,
}

interface BaseState {
  readonly interaction: Interaction | null;
  readonly status: Status;
  // isFresh allows us to distinguish between a state which has just been initiated and a state which failed at the first step
  readonly isFresh: boolean;
  readonly error: string | null;
  readonly steps: Steps | null;
}

export interface InitialState extends BaseState {
  readonly interaction: null;
  readonly status: Status.Initial;
  readonly steps: null;
}

export interface StateWithSteps extends BaseState {
  readonly interaction: Interaction;
  readonly steps: Steps;
}

export interface StateWithSplTokenAccounts extends StateWithSteps {
  readonly splTokenAccounts: readonly TokenAccountInfo[];
}

export interface InitiatedState extends StateWithSteps {
  readonly status: Status.Initiated;
}

export interface CreatedSplTokenAccountsState
  extends StateWithSplTokenAccounts {
  readonly status: Status.CreatedSplTokenAccounts;
}

export interface TransferredToSolanaState extends StateWithSplTokenAccounts {
  readonly status: Status.TransferredToSolana;
}

export interface CompletedPoolOperationsState
  extends StateWithSplTokenAccounts {
  readonly status: Status.CompletedPoolOperations;
  readonly steps: Steps<WormholeFromSolanaFullStep>;
}

export interface DoneState extends StateWithSplTokenAccounts {
  readonly status: Status.Done;
  readonly steps: Steps<WormholeFromSolanaFullStep>;
}

export type State =
  | InitialState
  | InitiatedState
  | CreatedSplTokenAccountsState
  | TransferredToSolanaState
  | CompletedPoolOperationsState
  | DoneState;

export const initialState: InitialState = {
  interaction: null,
  status: Status.Initial,
  isFresh: true,
  error: null,
  steps: null,
};

export const enum ActionType {
  InitiateInteraction = "initiateInteraction",
  CompleteCreateSplTokenAccounts = "completeCreateSplTokenAccounts",
  UpdateTransferToSolana = "updateTransferToSolana",
  UpdatePoolOperations = "updatePoolOperations",
  UpdateTransferFromSolana = "updateTransferFromSolana",
  RegisterError = "registerError",
  ClearError = "clearError",
}

export interface InitiateInteractionAction {
  readonly type: ActionType.InitiateInteraction;
  readonly config: Config;
  readonly splTokenAccounts: readonly TokenAccountInfo[];
  readonly interaction: Interaction;
  readonly txs: readonly Tx[];
}

export interface CompleteCreateSplTokenAccountsAction {
  readonly type: ActionType.CompleteCreateSplTokenAccounts;
  readonly splTokenAccounts: readonly TokenAccountInfo[];
  readonly existingTransferToTxs: TxsByTokenId;
}

export interface UpdateTransferToSolanaAction {
  readonly type: ActionType.UpdateTransferToSolana;
  readonly txs: TxsByTokenId;
}

export interface UpdatePoolOperationsAction {
  readonly type: ActionType.UpdatePoolOperations;
  readonly operationTxs: readonly SolanaTx[];
  readonly existingTransferFromTxs: TxsByTokenId;
}

export interface UpdateTransferFromSolanaAction {
  readonly type: ActionType.UpdateTransferFromSolana;
  readonly txs: TxsByTokenId;
}

export interface RegisterErrorAction {
  readonly type: ActionType.RegisterError;
  readonly error: SwimError;
}

export interface ClearErrorAction {
  readonly type: ActionType.ClearError;
  readonly signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>;
}

export type Action =
  | InitiateInteractionAction
  | CompleteCreateSplTokenAccountsAction
  | UpdateTransferToSolanaAction
  | UpdatePoolOperationsAction
  | UpdateTransferFromSolanaAction
  | RegisterErrorAction
  | ClearErrorAction;

export const isInProgress = (state: State): boolean =>
  state.error === null &&
  [
    Status.Initiated,
    Status.CreatedSplTokenAccounts,
    Status.TransferredToSolana,
    Status.CompletedPoolOperations,
  ].includes(state.status);

export const initiateInteraction = (
  _: State,
  action: InitiateInteractionAction,
): InitiatedState => {
  const steps = createSteps(
    action.config,
    action.interaction,
    action.splTokenAccounts,
    action.txs,
  );
  return {
    interaction: action.interaction,
    status: Status.Initiated,
    isFresh: true,
    error: null,
    steps,
  };
};

export const completeCreateSplTokenAccounts = (
  previousState: State,
  {
    splTokenAccounts,
    existingTransferToTxs,
  }: CompleteCreateSplTokenAccountsAction,
): CreatedSplTokenAccountsState => {
  if (previousState.status !== Status.Initiated) {
    throw new Error("Invalid action");
  }
  return {
    ...previousState,
    status: Status.CreatedSplTokenAccounts,
    isFresh: false,
    splTokenAccounts,
    steps: {
      ...previousState.steps,
      createSplTokenAccounts: {
        ...previousState.steps.createSplTokenAccounts,
        isComplete: true,
      },
      wormholeToSolana: {
        ...previousState.steps.wormholeToSolana,
        txs: existingTransferToTxs,
      },
    },
  };
};

const updateTransferToSolanaStatus = <T extends Transfer>(
  solanaWormhole: WormholeChainSpec,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  transfer: T,
  txs: TxsByTokenId,
): T => {
  const solanaMint = getSolanaTokenDetails(transfer.token).address;
  const splTokenAccount = findTokenAccountForMint(
    solanaMint,
    walletAddress,
    splTokenAccounts,
  );
  return {
    ...transfer,
    isComplete: didTransferToSolanaComplete(
      solanaWormhole,
      splTokenAccount,
      transfer,
      txs[transfer.token.id] ?? null,
    ),
  };
};

const updateTransfersToSolanaStatus = <T extends Transfer>(
  { wormhole }: SolanaSpec,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  transfers: Transfers<T>,
  txs: TxsByTokenId,
): Transfers<T> => {
  switch (transfers.type) {
    case TransferType.LpToken: {
      if (transfers.lpToken === null) {
        return transfers;
      }
      return {
        ...transfers,
        lpToken: updateTransferToSolanaStatus(
          wormhole,
          walletAddress,
          splTokenAccounts,
          transfers.lpToken,
          txs,
        ),
      };
    }
    case TransferType.Tokens:
      return {
        ...transfers,
        tokens: transfers.tokens.map((transfer) => {
          if (transfer === null) {
            return null;
          }
          return updateTransferToSolanaStatus(
            wormhole,
            walletAddress,
            splTokenAccounts,
            transfer,
            txs,
          );
        }),
      };
    default:
      throw new Error("Unknown transfers type");
  }
};

export const updateTransferToSolana = (
  solanaChain: SolanaSpec,
  previousState: State,
  { txs }: UpdateTransferToSolanaAction,
): CreatedSplTokenAccountsState | TransferredToSolanaState => {
  if (previousState.status === Status.TransferredToSolana) {
    return previousState;
  }
  if (previousState.status !== Status.CreatedSplTokenAccounts) {
    throw new Error("Invalid action");
  }
  const deduplicatedTxs = deduplicateTxsByTokenId(
    previousState.steps.wormholeToSolana.txs,
    txs,
  );
  const walletAddress =
    previousState.interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const updatedTransfers = updateTransfersToSolanaStatus(
    solanaChain,
    walletAddress,
    previousState.splTokenAccounts,
    previousState.steps.wormholeToSolana.transfers,
    deduplicatedTxs,
  );
  const isComplete = didAllTransfersComplete(updatedTransfers);
  const updatedStatus = isComplete
    ? Status.TransferredToSolana
    : previousState.status;
  return {
    ...previousState,
    status: updatedStatus,
    isFresh: false,
    steps: {
      ...previousState.steps,
      wormholeToSolana: {
        ...previousState.steps.wormholeToSolana,
        isComplete,
        transfers: updatedTransfers,
        txs: deduplicatedTxs,
      },
    },
  };
};

export const getTransferredAmounts = (
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  txs: readonly Tx[],
  // Record from token ID to Amount
): ReadonlyRecord<string, Amount | undefined> =>
  [lpToken, ...tokens].reduce<ReadonlyRecord<string, Amount | undefined>>(
    (accumulator, tokenSpec) => {
      const mint = getSolanaTokenDetails(tokenSpec).address;

      let amount = new Decimal(0);
      for (const tx of txs) {
        if (!isSolanaTx(tx)) {
          continue;
        }
        // Solana-native token
        amount = getAmountTransferredToAccountByMint(
          splTokenAccounts,
          tx.parsedTx,
          mint,
          walletAddress,
        );
        if (!amount.isZero()) {
          break;
        }
        // Wormhole-wrapped token
        amount = getAmountMintedToAccountByMint(
          splTokenAccounts,
          tx.parsedTx,
          mint,
          walletAddress,
        );
        if (!amount.isZero()) {
          break;
        }
      }

      return {
        ...accumulator,
        [tokenSpec.id]: Amount.fromAtomic(
          tokenSpec,
          amount,
          EcosystemId.Solana,
        ),
      };
    },
    {},
  );

export const updatePoolOperations = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  previousState: State,
  { operationTxs, existingTransferFromTxs }: UpdatePoolOperationsAction,
): TransferredToSolanaState | CompletedPoolOperationsState => {
  if (previousState.status !== Status.TransferredToSolana) {
    throw new Error("Invalid action");
  }
  const walletAddress =
    previousState.interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }

  const deduplicatedTxs = deduplicateTxs<SolanaTx>([
    ...previousState.steps.doPoolOperations.txs,
    ...operationTxs,
  ]);
  if (deduplicatedTxs.length < poolSpecs.length) {
    return {
      ...previousState,
      steps: {
        ...previousState.steps,
        doPoolOperations: {
          ...previousState.steps.doPoolOperations,
          txs: deduplicatedTxs,
        },
      },
    };
  }

  const outputPool = poolSpecs[poolSpecs.length - 1];
  const { tokens, lpToken } = tokensByPoolId[outputPool.id];

  const transferredAmounts = getTransferredAmounts(
    walletAddress,
    previousState.splTokenAccounts,
    tokens,
    lpToken,
    operationTxs,
  );
  const { transfers } = previousState.steps.wormholeFromSolana;
  const newTransfers: Transfers<Transfer> =
    transfers.type === TransferType.LpToken
      ? {
          ...transfers,
          lpToken: transfers.lpToken && {
            ...transfers.lpToken,
            amount: transferredAmounts[lpToken.id] ?? Amount.zero(lpToken),
          },
        }
      : {
          ...transfers,
          tokens: transfers.tokens.map(
            (transfer: Transfer | ProtoTransfer | null): Transfer | null => {
              if (transfer === null) {
                return null;
              }
              const amount =
                transferredAmounts[transfer.token.id] ??
                Amount.zero(transfer.token);
              return {
                ...transfer,
                amount,
              };
            },
          ),
        };

  return {
    ...previousState,
    status: Status.CompletedPoolOperations,
    isFresh: false,
    steps: {
      ...previousState.steps,
      doPoolOperations: {
        ...previousState.steps.doPoolOperations,
        isComplete: true,
        txs: operationTxs,
      },
      wormholeFromSolana: previousState.steps.wormholeFromSolana.knownAmounts
        ? {
            ...previousState.steps.wormholeFromSolana,
            txs: existingTransferFromTxs,
          }
        : {
            ...previousState.steps.wormholeFromSolana,
            txs: existingTransferFromTxs,
            knownAmounts: true,
            transfers: newTransfers,
          },
    },
  };
};

const updateTransferFromSolanaStatus = <T extends Transfer>(
  evmChains: readonly EvmSpec[],
  transfer: T,
  txs: TxsByTokenId,
): T => {
  const evmSpec = findOrThrow(
    evmChains,
    (chain) => chain.ecosystem === transfer.toEcosystem,
  );
  return {
    ...transfer,
    isComplete: didTransferFromSolanaComplete(
      evmSpec.wormhole,
      transfer,
      txs[transfer.token.id] ?? null,
    ),
  };
};

const updateTransfersFromSolanaStatus = <T extends Transfer>(
  evmChains: readonly EvmSpec[],
  transfers: Transfers<T>,
  txs: TxsByTokenId,
): Transfers<T> => {
  switch (transfers.type) {
    case TransferType.LpToken: {
      if (transfers.lpToken === null) {
        return transfers;
      }
      return {
        ...transfers,
        lpToken: updateTransferFromSolanaStatus(
          evmChains,
          transfers.lpToken,
          txs,
        ),
      };
    }
    case TransferType.Tokens:
      return {
        ...transfers,
        tokens: transfers.tokens.map((transfer) => {
          if (transfer === null) {
            return null;
          }
          return updateTransferFromSolanaStatus(evmChains, transfer, txs);
        }),
      };
    default:
      throw new Error("Unknown transfers type");
  }
};

export const updateTransferFromSolana = (
  evmChains: readonly EvmSpec[],
  previousState: State,
  { txs }: UpdateTransferFromSolanaAction,
): CompletedPoolOperationsState | DoneState => {
  if (previousState.status === Status.Done) {
    return previousState;
  }
  if (previousState.status !== Status.CompletedPoolOperations) {
    throw new Error("Invalid action");
  }
  const deduplicatedTxs = deduplicateTxsByTokenId(
    previousState.steps.wormholeFromSolana.txs,
    txs,
  );
  const updatedTransfers = updateTransfersFromSolanaStatus(
    evmChains,
    previousState.steps.wormholeFromSolana.transfers,
    deduplicatedTxs,
  );
  const isComplete = didAllTransfersComplete(updatedTransfers);
  const updatedStatus = isComplete ? Status.Done : previousState.status;
  return {
    ...previousState,
    status: updatedStatus,
    isFresh: false,
    steps: {
      ...previousState.steps,
      wormholeFromSolana: {
        ...previousState.steps.wormholeFromSolana,
        isComplete,
        transfers: updatedTransfers,
        txs: deduplicatedTxs,
      },
    },
  };
};

const registerError = (
  previousState: State,
  { error }: RegisterErrorAction,
): State => {
  return {
    ...previousState,
    isFresh: false,
    error: error.toPrettyString(),
  };
};

const clearError = (
  previousState: State,
  { signatureSetKeypairs }: ClearErrorAction,
): State => {
  // NOTE: If we hit an error when transferring to Solana then we need to
  // regenerate the signature set keys for the post VAA step of redeeming
  // tokens on Solana
  if (previousState.status !== Status.CreatedSplTokenAccounts) {
    return {
      ...previousState,
      isFresh: false,
      error: null,
    };
  }

  const interaction: Interaction = {
    ...previousState.interaction,
    signatureSetKeypairs,
    previousSignatureSetAddresses: {
      ...previousState.interaction.previousSignatureSetAddresses,
      ...getSignatureSetAddresses(
        previousState.interaction.signatureSetKeypairs,
      ),
    },
  };
  return {
    ...previousState,
    steps: {
      ...previousState.steps,
      wormholeToSolana: {
        ...previousState.steps.wormholeToSolana,
        transfers: updateTransfersWithNewSignatureSetKeypairs(
          previousState.steps.wormholeToSolana.transfers,
          signatureSetKeypairs,
        ),
      },
    },
    interaction,
    isFresh: false,
    error: null,
  };
};

export const reducer =
  (config: Config) =>
  (previousState: State, action: Action): State => {
    const [solanaChain] = config.chains[Protocol.Solana];
    const evmChains = config.chains[Protocol.Evm];
    const tokensByPoolId = getTokensByPool(config);

    switch (action.type) {
      case ActionType.InitiateInteraction:
        return initiateInteraction(previousState, action);
      case ActionType.CompleteCreateSplTokenAccounts:
        return completeCreateSplTokenAccounts(previousState, action);
      case ActionType.UpdateTransferToSolana:
        return updateTransferToSolana(solanaChain, previousState, action);
      case ActionType.UpdatePoolOperations: {
        // TODO: Move check into handler
        if (previousState.interaction === null) {
          throw new Error("Missing interaction");
        }
        const requiredPools = getRequiredPools(
          config.pools,
          previousState.interaction,
        );
        return updatePoolOperations(
          tokensByPoolId,
          requiredPools,
          previousState,
          action,
        );
      }
      case ActionType.UpdateTransferFromSolana:
        return updateTransferFromSolana(evmChains, previousState, action);
      case ActionType.RegisterError:
        return registerError(previousState, action);
      case ActionType.ClearError:
        return clearError(previousState, action);
      default:
        throw new Error("Action type not supported");
    }
  };
