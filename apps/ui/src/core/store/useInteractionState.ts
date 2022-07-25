import * as Sentry from "@sentry/react";
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import type { GetState, SetState } from "zustand";
import create from "zustand";

import type { Env } from "../../config";
import type { Interaction, InteractionState } from "../../models";
import type { ReadonlyRecord } from "../../utils";

import {
  addInteractionStateToDb,
  getInteractionStatesFromDb,
  putInteractionStateToDb,
} from "./idb";

export interface InteractionStore {
  readonly errorMap: ReadonlyRecord<Interaction["id"], Error | undefined>;
  readonly interactionStates: readonly InteractionState[];
  readonly recentInteractionId: string | null;
  readonly setInteractionError: (id: string, error: Error | undefined) => void;
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly loadInteractionStatesFromIDB: (env: Env) => void;
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
    setInteractionError: (id: string, error: Error | undefined) => {
      set(
        produce<InteractionStore>((draft) => {
          draft.errorMap[id] = error;
        }),
      );
    },
    loadInteractionStatesFromIDB: async (env) => {
      const data = await getInteractionStatesFromDb(env);
      if (data) {
        set(
          produce<InteractionStore>((draft) => {
            draft.interactionStates = castDraft(data);
          }),
        );
      }
    },
    addInteractionState: (interactionState) => {
      set(
        produce<InteractionStore>((draft) => {
          draft.interactionStates.unshift(castDraft(interactionState));
          draft.recentInteractionId = interactionState.interaction.id;
        }),
      );
      addInteractionStateToDb(interactionState);
    },
    updateInteractionState: (interactionId, updateCallback) => {
      set(
        produce<InteractionStore>((draft) => {
          const index = draft.interactionStates.findIndex(
            ({ interaction }) => interaction.id === interactionId,
          );
          if (index > -1) {
            updateCallback(draft.interactionStates[index]);
          } else {
            Sentry.captureMessage(
              "Failed to find interactionStates in updateInteractionState store function",
            );
          }
        }),
      );
      const updatedInteractionState = get().interactionStates.find(
        ({ interaction }) => interaction.id === interactionId,
      );
      if (!updatedInteractionState) {
        throw new Error("Updated interaction state not found");
      }
      putInteractionStateToDb(updatedInteractionState);
    },
  }),
);
