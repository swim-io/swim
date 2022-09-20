import * as Sentry from "@sentry/react";
import type { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import { findOrThrow } from "@swim-io/utils";
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import create from "zustand";

import type { InteractionStateV2, InteractionV2 } from "../../models";

import {
  addInteractionStateToDb,
  getInteractionStatesFromDbV2,
  putInteractionStateToDb,
} from "./idb";

export interface InteractionStoreV2 {
  readonly errorMap: ReadonlyRecord<InteractionV2["id"], Error | undefined>;
  readonly interactionStates: readonly InteractionStateV2[];
  readonly recentInteractionId: string | null;
  readonly setInteractionError: (id: string, error: Error | undefined) => void;
  readonly addInteractionState: (interactionState: InteractionStateV2) => void;
  readonly getInteractionState: (id: string) => InteractionStateV2;
  readonly loadInteractionStatesFromIdb: (env: Env) => Promise<void>;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: Draft<InteractionStateV2>) => void,
  ) => void;
}

export const useInteractionStateV2 = create<InteractionStoreV2>((set, get) => ({
  errorMap: {},
  interactionStates: [],
  recentInteractionId: null,
  setInteractionError: (id: string, error: Error | undefined) => {
    set(
      produce<InteractionStoreV2>((draft) => {
        draft.errorMap[id] = error;
      }),
    );
  },
  getInteractionState: (id: string) =>
    findOrThrow(
      get().interactionStates,
      ({ interaction }) => interaction.id === id,
    ),
  loadInteractionStatesFromIdb: async (env) => {
    const data = await getInteractionStatesFromDbV2(env);
    if (data) {
      set(
        produce<InteractionStoreV2>((draft) => {
          draft.interactionStates = castDraft(data);
        }),
      );
    }
  },
  addInteractionState: (interactionState) => {
    set(
      produce<InteractionStoreV2>((draft) => {
        draft.interactionStates.unshift(castDraft(interactionState));
        draft.recentInteractionId = interactionState.interaction.id;
      }),
    );
    addInteractionStateToDb(interactionState);
  },
  updateInteractionState: (interactionId, updateCallback) => {
    set(
      produce<InteractionStoreV2>((draft) => {
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
