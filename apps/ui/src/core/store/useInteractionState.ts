/* eslint-disable functional/immutable-data */
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";

import type { Interaction, InteractionState } from "../../models";
import type { ReadonlyRecord } from "../../utils";

import { idb } from "./idb";

export interface InteractionStore {
  readonly errorMap: ReadonlyRecord<Interaction["id"], Error | undefined>;
  readonly interactionStates: readonly InteractionState[];
  readonly recentInteractionId: string | null;
  readonly getInteractionError: (id: string) => Error | undefined;
  readonly setInteractionError: (id: string, error: Error | undefined) => void;
  readonly getInteractionState: (interactionId: string) => InteractionState;
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly getInteractionStatesFromIDB: () => Promise<
    void | readonly InteractionState[]
  >;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: Draft<InteractionState>) => void,
  ) => void;
}

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
        throw new Error(`Interaction ${id} not exist`);
      }
      return interactionState;
    },
    getInteractionStatesFromIDB: async () => {
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
          draft.interactionStates.push(castDraft(interactionState));
          draft.recentInteractionId = interactionState.interaction.id;
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
          updateCallback(draft.interactionStates[index]);
        }),
      );
    },
  }),
);
