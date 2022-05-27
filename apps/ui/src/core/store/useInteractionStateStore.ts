/* eslint-disable functional/immutable-data */
import { createDraft, produce } from "immer";
import type { WritableDraft } from "immer/dist/internal";
import type { SetState } from "zustand";
import create from "zustand";

import type { InteractionState } from "../../models";

export interface InteractionStateStore {
  readonly interactionStateStore: readonly InteractionState[];
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateFn: (draft: WritableDraft<InteractionState>) => void,
  ) => void;
}

export const useInteractionStateStore = create<InteractionStateStore>(
  (set: SetState<InteractionStateStore>) => ({
    interactionStateStore: [],
    addInteractionState: (
      interactionState: InteractionState,
    ): InteractionState => {
      set(
        produce<InteractionStateStore>((draft) => {
          draft.interactionStateStore.push(createDraft(interactionState));
        }),
      );
      return interactionState;
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
