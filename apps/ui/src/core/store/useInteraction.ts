/* eslint-disable functional/immutable-data */
import { createDraft, produce } from "immer";
import type { GetState, SetState, StoreApi } from "zustand";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type { InteractionState } from "../../models";

export interface InteractionStore {
  readonly interactionStates: readonly InteractionState[];
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: InteractionState) => void,
  ) => void;
}

export const useInteraction = create(
  persist<InteractionStore>(
    (
      set: SetState<InteractionStore>,
      get: GetState<InteractionStore>,
      api: StoreApi<InteractionStore>,
    ) => ({
      interactionStates: [],
      addInteractionState: (interactionState) => {
        set(
          produce<InteractionStore>((draft) => {
            draft.interactionStates.push(createDraft(interactionState));
          }),
        );
      },
      updateInteractionState: (interactionId, updateCallback) => {
        set(
          produce<InteractionStore>((draft, state) => {
            const index = draft.interactionStates.findIndex(
              ({ interaction }) => interaction.id === interactionId,
            );
            const data: InteractionState = state.interactionStates[index];
            updateCallback(data);
          }),
        );
      },
    }),
    {
      name: "interactions-db",
      getStorage: (): StateStorage => localStorage, // TODO: link with IndexedDB
    },
  ),
);
