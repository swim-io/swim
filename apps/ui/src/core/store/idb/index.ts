import type { Env } from "@swim-io/core";
import { isNotNull } from "@swim-io/utils";
import type { Table } from "dexie";
import Dexie from "dexie";

import type {
  InteractionState,
  InteractionStateV2,
  InteractionType,
} from "../../../models";
import { INTERACTION_GROUPS } from "../../../models";

import type {
  PersistedInteractionState,
  PersistedInteractionStateV2,
} from "./helpers";
import {
  deserializeInteractionState,
  prepareInteractionState,
} from "./helpers";
import {
  deserializeInteractionStateV2,
  serializeInteractionStateV2,
} from "./helpersV2";

const MAX_STORED_INTERACTIONS = 10;

const getInteractionTypeGroup = (interactionType: InteractionType) => {
  const group = INTERACTION_GROUPS.find((set) => set.has(interactionType));
  if (!group) {
    throw new Error("Unknown interaction type");
  }
  return group;
};

type IDBState = {
  readonly id: string;
} & (PersistedInteractionState | PersistedInteractionStateV2);

class SwimIDB extends Dexie {
  public readonly interactionStates!: Table<IDBState, string>;

  public constructor() {
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
      return data
        .map((datum) => {
          try {
            return datum.version === undefined
              ? deserializeInteractionState(datum)
              : null;
          } catch (error) {
            console.warn(
              "Error during de-serialization of interaction",
              datum,
              error,
            );
            return null;
          }
        })
        .filter(isNotNull);
    })
    .catch((err) => {
      console.warn(err);
    });
};

export const getInteractionStatesFromDbV2 = (env: Env) => {
  return idb
    .transaction("r", "interactionStates", async () => {
      const data = await idb.interactionStates
        .filter((idbState) => idbState.interaction.env === env)
        .reverse()
        .sortBy("interaction.submittedAt");
      return data
        .map((datum) => {
          try {
            return datum.version === 2
              ? deserializeInteractionStateV2(datum)
              : null;
          } catch (error) {
            console.warn(
              "Error during de-serialization of interaction",
              datum,
              error,
            );
            return null;
          }
        })
        .filter(isNotNull);
    })
    .catch((err) => {
      console.warn(err);
    });
};

export const addInteractionStateToDb = (
  interactionState: InteractionState | InteractionStateV2,
) => {
  idb
    .transaction("rw", "interactionStates", async () => {
      const serializedState =
        interactionState.version === 2
          ? serializeInteractionStateV2(interactionState)
          : prepareInteractionState(interactionState);
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

export const putInteractionStateToDb = (
  interactionState: InteractionState | InteractionStateV2,
) => {
  idb
    .transaction("rw", "interactionStates", async () => {
      const serializedState =
        interactionState.version === 2
          ? serializeInteractionStateV2(interactionState)
          : prepareInteractionState(interactionState);
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

// eslint-disable-next-line import/no-unused-modules
export const resetDb = () => {
  return idb.transaction("rw", idb.interactionStates, async () => {
    await Promise.all(idb.tables.map((table) => table.clear()));
  });
};
