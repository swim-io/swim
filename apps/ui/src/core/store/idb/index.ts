import type { Table } from "dexie";
import Dexie from "dexie";

import type { Env } from "../../../config";
import type {
  InteractionState,
  InteractionStateV2,
  InteractionType,
} from "../../../models";
import { INTERACTION_GROUPS } from "../../../models";
import { isNotNull } from "../../../utils";

import type {
  PersistedInteractionState,
  PersistedInteractionStateV2,
} from "./helpers";
import {
  deserializeInteractionState,
  deserializeInteractionStateV2,
  prepareInteractionState,
  prepareInteractionStateV2,
} from "./helpers";

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
} & PersistedInteractionState;

type IDBStateV2 = {
  readonly id: string;
} & PersistedInteractionStateV2;

class SwimIDB extends Dexie {
  interactionStates!: Table<IDBState, string>;
  interactionStatesV2!: Table<IDBStateV2, string>;

  constructor() {
    super("SwimIDB");
    this.version(1).stores({ interactionStates: "&id" });
    this.version(2).stores({ interactionStatesV2: "&id" });
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
            return deserializeInteractionState(datum);
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

export const getInteractionStatesFromDbV2 = async (env: Env) => {
  const data = await idb.interactionStatesV2
    .filter((idbState) => idbState.interaction.env === env)
    .reverse()
    .sortBy("interaction.submittedAt");
  return data
    .map((datum) => {
      try {
        return deserializeInteractionStateV2(datum);
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
};

export const addInteractionStateToDbV2 = (
  interactionState: InteractionStateV2,
) => {
  (async () => {
    const serializedState = prepareInteractionStateV2(interactionState);
    await idb.interactionStatesV2.add(
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
  })().catch((err) => {
    console.warn("Fail to add interactionState into idb", err);
  });
};

export const putInteractionStateToDbV2 = (
  interactionState: InteractionStateV2,
) => {
  (async () => {
    const serializedState = prepareInteractionStateV2(interactionState);
    await idb.interactionStatesV2.put(
      {
        id: interactionState.interaction.id,
        ...serializedState,
      },
      interactionState.interaction.id,
    );
  })().catch((err) => {
    console.warn("Fail to put interactionState into idb", err);
  });
};
