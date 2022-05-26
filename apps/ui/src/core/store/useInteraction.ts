/* eslint-disable functional/immutable-data */
import { createDraft, produce } from "immer";
import type { Draft } from "immer";
import type { GetState, SetState, StoreApi } from "zustand";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type {
  FromSolanaTransferState,
  Interaction,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  ToSolanaTransferState,
} from "../../models";

export interface InteractionState {
  readonly interactions: readonly Interaction[];
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly toSolanaTransfers: readonly ToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly fromSolanaTransfers: readonly FromSolanaTransferState[];
  readonly currentInteractionIndex: number;
  readonly addInteraction: (interaction: Interaction) => void;
  readonly setCurrentInteraction: (interactionId: string) => void;
}

export const createInteractionSlice = create(
  persist<InteractionState>(
    (
      set: SetState<InteractionState>,
      get: GetState<InteractionState>,
      api: StoreApi<InteractionState>,
    ) => ({
      interactions: [],
      requiredSplTokenAccounts: {},
      toSolanaTransfers: [],
      solanaPoolOperations: [],
      fromSolanaTransfers: [],
      currentInteractionIndex: 0,
      addInteraction: (interaction: Interaction) => {
        set(
          produce<InteractionState>((draft) => {
            draft.interactions.push(createDraft(interaction));
          }),
        );
      },
      setCurrentInteraction: (interactionId) => {
        set(
          produce<InteractionState>((draft) => {
            draft.currentInteractionIndex = draft.interactions.findIndex(
              (interaction) => interaction.id === interactionId,
            );
          }),
        );
      },
    }),
    {
      name: "interaction-db",
      getStorage: (): StateStorage => localStorage,
    },
  ),
);
