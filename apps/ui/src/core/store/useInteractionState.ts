import { createDraft, enableMapSet, produce } from "immer";
import type { WritableDraft } from "immer/dist/internal";
import type { GetState, SetState } from "zustand";
import create from "zustand";

import type { Interaction, InteractionState } from "../../models";
import type { ReadonlyRecord } from "../../utils";

export interface InteractionStore {
  readonly errorMap: ReadonlyRecord<Interaction["id"], Error | undefined>;
  readonly interactionStates: readonly InteractionState[];
  readonly recentInteractionId: string | null;
  readonly getInteractionError: (id: string) => Error | undefined;
  readonly setInteractionError: (id: string, error: Error | undefined) => void;
  readonly getInteractionState: (interactionId: string) => InteractionState;
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (draft: WritableDraft<InteractionState>) => void,
  ) => void;
  readonly reset: () => void;
}

enableMapSet();

export const useInteractionState = create(
  (set: SetState<InteractionStore>, get: GetState<InteractionStore>) => ({
    errorMap: {},
    interactionStates: [],
    recentInteractionId: null,
    getInteractionError: (id: string) => get().errorMap[id],
    setInteractionError: (id: string, error: Error | undefined) => {
      set(
        produce<InteractionStore>((draft) => {
          draft.errorMap[id] = error;
        }),
      );
    },
    getInteractionState: (id: string) => {
      const interactionState = get().interactionStates.find(
        ({ interaction }) => interaction.id === id,
      );
      if (!interactionState) {
        throw new Error("Interaction does not exist");
      }
      return interactionState;
    },
    addInteractionState: (interactionState) => {
      set(
        produce<InteractionStore>((draft) => {
          draft.interactionStates.unshift(createDraft(interactionState));
          draft.recentInteractionId = interactionState.interaction.id;
        }),
      );
    },
    updateInteractionState: (interactionId, updateCallback) => {
      set(
        produce<InteractionStore>((draft) => {
          const index = draft.interactionStates.findIndex(
            ({ interaction }) => interaction.id === interactionId,
          );
          updateCallback(draft.interactionStates[index]);
        }),
      );
    },
    reset: () =>
      set(
        produce<InteractionStore>((draft) => {
          draft.errorMap = {};
          draft.interactionStates = [];
          draft.recentInteractionId = null;
        }),
      ),
  }),
);
