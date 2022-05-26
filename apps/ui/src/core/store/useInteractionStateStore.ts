/* eslint-disable functional/immutable-data */
import { createDraft, produce } from "immer";
import type { WritableDraft } from "immer/dist/internal";
import type { SetState } from "zustand";
import create from "zustand";

import {
  EcosystemId,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useConfig, useEnvironment, useSolanaWallet } from "../../contexts";
import {
  usePoolMaths,
  useSplTokenAccountsQuery,
  useWallets,
} from "../../hooks";
import {
  useRequiredPoolsForInteraction,
  useRequiredTokensForInteraction,
} from "../../hooks/interaction";
import type {
  FromSolanaTransferState,
  Interaction,
  InteractionSpec,
  InteractionState,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  ToSolanaTransferState,
} from "../../models";
import {
  InteractionType,
  createOperationSpecs,
  findTokenAccountForMint,
  generateId,
  getConnectedWallets,
  getRequiredPools,
  getTokensByPool,
} from "../../models";
import { isNotNull } from "../../utils";

export interface InteractionStateStore {
  readonly interactionStateStore: readonly InteractionState[];
  readonly createInteraction: (interactionSpec: InteractionSpec) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateFn: (draft: WritableDraft<InteractionState>) => void,
  ) => void;
}

const useCreateInteractionFromSpec = (
  interactionSpec: InteractionSpec,
): Interaction => {
  const interactionId = generateId();
  const config = useConfig();
  const wallets = useWallets();
  const { env } = useEnvironment();
  const requiredPools = getRequiredPools(config.pools, interactionSpec);
  const inputPool = requiredPools.find(Boolean) ?? null;
  if (inputPool === null) {
    throw new Error("Unknown input pool");
  }
  const connectedWallets = getConnectedWallets(
    config.tokens,
    interactionSpec,
    wallets,
  );
  return {
    ...interactionSpec,
    id: interactionId,
    poolIds: requiredPools.map((pool) => pool.id),
    env,
    submittedAt: Date.now(),
    signatureSetKeypairs: {},
    previousSignatureSetAddresses: {},
    connectedWallets,
  };
};

export const useRequiredSplTokenAccounts = (
  interaction: Interaction,
): RequiredSplTokenAccounts => {
  const requiredTokens = useRequiredTokensForInteraction(interaction);
  const mints = requiredTokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const { data: tokenAccounts = [] } = useSplTokenAccountsQuery();
  const { address: walletAddress } = useSolanaWallet();
  if (walletAddress === null) {
    throw new Error("No Solana wallet address found");
  }
  return mints.reduce((state, mint) => {
    const accountForMint = findTokenAccountForMint(
      mint,
      walletAddress,
      tokenAccounts,
    );
    return {
      ...state,
      [mint]: {
        isExistingAccount: accountForMint !== null,
        account: accountForMint,
        txId: null,
      },
    };
  }, {});
};

export const useCreateToSolanaTransfers = (
  interaction: Interaction,
): readonly ToSolanaTransferState[] => {
  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }
  const {
    params: { exactInputAmount },
  } = interaction;
  const fromToken = exactInputAmount.tokenSpec;
  const fromEcosystem = fromToken.nativeEcosystem;
  // No ToSolanaTransfer if fromToken is not Evm
  if (!isEvmEcosystemId(fromEcosystem)) {
    return [];
  }
  return [
    {
      token: fromToken,
      value: exactInputAmount.toHuman(fromEcosystem),
      txIds: {
        approveAndTransferEvmToken: null,
        postVaaOnSolana: null,
        claimTokenOnSolana: null,
      },
    },
  ];
};

export const useCreateSolanaPoolOperations = (
  interaction: Interaction,
): readonly SolanaPoolOperationState[] => {
  const config = useConfig();
  const tokensByPoolId = getTokensByPool(config);
  const pools = useRequiredPoolsForInteraction(interaction);
  const poolMaths = usePoolMaths(pools.map(({ id }) => id)).filter(isNotNull);
  const operationSpecs = createOperationSpecs(
    tokensByPoolId,
    pools,
    poolMaths,
    interaction,
  );
  return operationSpecs.map((operation) => ({
    operation,
    txId: null,
  }));
};

export const useCreateFromSolanaTransfers = (
  interaction: Interaction,
): readonly FromSolanaTransferState[] => {
  // Only for swap at the moment
  if (interaction.type !== InteractionType.Swap) {
    return [];
  }
  const {
    params: { minimumOutputAmount },
  } = interaction;
  const toToken = minimumOutputAmount.tokenSpec;
  // No WormholeFromSolana if toToken is Solana
  if (toToken.nativeEcosystem === EcosystemId.Solana) {
    return [];
  }
  return [
    {
      token: toToken,
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ];
};

const useCreateInteractionState = (
  interactionSpec: InteractionSpec,
): InteractionState => {
  const interaction = useCreateInteractionFromSpec(interactionSpec);
  return {
    interaction,
    requiredSplTokenAccounts: useRequiredSplTokenAccounts(interaction),
    toSolanaTransfers: useCreateToSolanaTransfers(interaction),
    solanaPoolOperations: useCreateSolanaPoolOperations(interaction),
    fromSolanaTransfers: useCreateFromSolanaTransfers(interaction),
  };
};

export const useInteractionStateStore = create<InteractionStateStore>(
  (set: SetState<InteractionStateStore>) => ({
    interactionStateStore: [],
    createInteraction: (interactionSpec: InteractionSpec) => {
      set(
        produce<InteractionStateStore>((draft) => {
          const interactionState = useCreateInteractionState(interactionSpec);
          draft.interactionStateStore.push(createDraft(interactionState));
        }),
      );
    },
    updateInteractionState: (interactionId, updateFn) => {
      set(
        produce<InteractionStateStore>((draft) => {
          const index = draft.interactionStateStore.findIndex(
            ({ interaction }) => interaction.id === interactionId,
          );
          updateFn(draft.interactionStateStore[index]);
        }),
      );
    },
  }),
);
