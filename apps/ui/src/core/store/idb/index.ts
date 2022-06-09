import type { Table } from "dexie";
import Dexie from "dexie";

import type { Env } from "../../../config";
import type { InteractionState } from "../../../models";
import { InteractionType } from "../../../models";

import type { PersistedInteractionState } from "./helpers";
import {
  deserializeInteractionState,
  prepareInteractionState,
} from "./helpers";

const MAX_STORED_INTERACTIONS = 10;

const INTERACTION_GROUP = [
  new Set([InteractionType.Swap]),
  new Set([InteractionType.Add]),
  new Set([
    InteractionType.RemoveExactBurn,
    InteractionType.RemoveExactOutput,
    InteractionType.RemoveUniform,
  ]),
];

const getInteractionTypeGroup = (interactionType: InteractionType) => {
  const group = INTERACTION_GROUP.find((set) => set.has(interactionType));
  if (!group) {
    throw new Error("Unknown interaction type");
  }
  return group;
};

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
        .reverse()
        .sortBy("interaction.submittedAt");
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

      const interactionGroup = getInteractionTypeGroup(
        interactionState.interaction.type,
      );
      const collection = await idb.interactionStates
        .filter(
          (idbState) =>
            idbState.interaction.env === interactionState.interaction.env &&
            interactionGroup.has(idbState.interaction.type),
        )
        .sortBy("interaction.submittedAt");
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

export const putInteractionStateToDb = (interactionState: InteractionState) => {
  idb
    .transaction("rw", "interactionStates", async () => {
      const serializedState = prepareInteractionState(interactionState);
      await idb.interactionStates.put(
        {
          id: interactionState.interaction.id,
          ...serializedState,
        },
        interactionState.interaction.id,
      );
    })
    .catch((err) => {
      console.warn("Fail to put interactionState into idb", err);
    });
};

export const resetDb = () => {
  return idb.transaction("rw", idb.interactionStates, async () => {
    await Promise.all(idb.tables.map((table) => table.clear()));
  });
};
