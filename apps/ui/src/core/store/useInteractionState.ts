/* eslint-disable functional/immutable-data */
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";

import { InteractionState } from "../../models";

import { idb } from "./idb";

export interface InteractionStore {
  readonly interactionStates: readonly InteractionState[];
  readonly loadIndexedDB: () => void;
  readonly addInteractionState: (interactionState: any) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: Draft<InteractionState>) => void,
  ) => void;
}

export const useInteractionState = create(
  (set: SetState<InteractionStore>, get: GetState<InteractionStore>) => ({
    interactionStates: [],
    loadIndexedDB: async () => {
      const data = (await idb.getInteractionStates()) || [];
      set(
        produce<InteractionStore>((draft) => {
          draft.interactionStates = castDraft(data);
        }),
      );
    },
    addInteractionState: (interactionState) => {
      set(
        produce<InteractionStore>((draft) => {
          const hasInteraction = draft.interactionStates.find(
            (storedState) =>
              storedState.interaction.id === interactionState.interaction.id,
          );
          if (!hasInteraction) {
            draft.interactionStates.push(castDraft(interactionState));
          }
        }),
      );
      idb.addInteractionState(interactionState);
    },
    updateInteractionState: (interactionId, updateCallback) => {
      set(
        produce<InteractionStore>((draft) => {
          const index = draft.interactionStates.findIndex(
            ({ interaction }) => interaction.id === interactionId,
          );
          if (index > -1) {
            updateCallback(draft.interactionStates[index]);
          }
        }),
      );
    },
  }),
);
