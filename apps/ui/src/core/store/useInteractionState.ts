/* eslint-disable functional/immutable-data */
import type { Draft } from "immer";
import { castDraft, produce } from "immer";
import type { GetState, SetState, StoreApi } from "zustand";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type { InteractionState } from "../../models";
import { InteractionIDBStorage } from "./idb/interactionDB";

export interface InteractionStore {
  readonly interactionStates: readonly InteractionState[];
  readonly loadIndexedDB: () => void;
  readonly addInteractionState: (interactionState: InteractionState) => void;
  readonly updateInteractionState: (
    interactionId: string,
    updateCallback: (interactionState: Draft<InteractionState>) => void,
  ) => void;
}

export const useInteractionState = create(
  persist<InteractionStore>(
    (
      set: SetState<InteractionStore>,
      get: GetState<InteractionStore>,
      api: StoreApi<InteractionStore>,
    ) => ({
      interactionStates: [],
      loadIndexedDB: async () => {
        const data =
          (await InteractionIDBStorage.getItem("InteractionIDB")) || "[]";
        set(
          produce<InteractionStore>((draft) => {
            draft.interactionStates = JSON.parse(data);
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
    {
      name: "InteractionDB",
      getStorage: (): StateStorage => InteractionIDBStorage,
    },
  ),
);
