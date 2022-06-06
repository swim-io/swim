import type { Table } from "dexie";
import Dexie from "dexie";

import type { Env } from "../../../config";
import type { InteractionState } from "../../../models";

import type { PersistedInteractionState } from "./helpers";
import {
  deserializeInteractionState,
  prepareInteractionState,
} from "./helpers";

const MAX_STORED_INTERACTIONS = 10;

type IDBState = {
  readonly id: string;
} & PersistedInteractionState;

class SwimIDB extends Dexie {
  interactionStates!: Table<IDBState, string>;

  constructor() {
    super("SwimIDB");
    this.version(1).stores({ interactionStates: "&id" });
  }
}

const idb = new SwimIDB();

export const getInteractionStatesFromDb = (env: Env) => {
  return idb
    .transaction("r", "interactionStates", async () => {
      const data = await idb.interactionStates
        .filter((idbState) => idbState.interaction.env === env)
        .sortBy("interaction.submittedAt")
        .then((sorted) => sorted);
      return data.map(deserializeInteractionState);
    })
    .catch((err) => {
      console.warn(err);
    });
};

export const addInteractionStateToDb = (interactionState: InteractionState) => {
  idb
    .transaction("rw", "interactionStates", async () => {
      const serializedState = prepareInteractionState(interactionState);
      await idb.interactionStates.add(
        {
          id: interactionState.interaction.id,
          ...serializedState,
        },
        interactionState.interaction.id,
      );
      const collection = await idb.interactionStates
        .filter(
          (idbState) =>
            idbState.interaction.env === interactionState.interaction.env,
        )
        .sortBy("interaction.submittedAt")
        .then((sorted) => sorted);
      const size = collection.length;
      if (size > MAX_STORED_INTERACTIONS) {
        const diff = size - MAX_STORED_INTERACTIONS;
        for (let index = 0; index < diff; index++) {
          await idb.interactionStates.delete(collection[index].id);
        }
      }
    })
    .catch((err) => {
      console.warn("Fail to add interactionState into idb", err);
    });
};

export const resetDb = () => {
  return idb.transaction("rw", idb.interactionStates, async () => {
    await Promise.all(idb.tables.map((table) => table.clear()));
  });
};
