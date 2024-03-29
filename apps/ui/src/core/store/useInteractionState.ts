import * as Sentry from "@sentry/react";
import type { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import create from "zustand";

import type { Interaction, InteractionState } from "../../models";

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
  readonly loadInteractionStatesFromIdb: (env: Env) => Promise<void>;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: Draft<InteractionState>) => void,
  ) => void;
}

export const useInteractionState = create<InteractionStore>((set, get) => ({
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
  loadInteractionStatesFromIdb: async (env) => {
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
}));
