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
export class SwimIDB extends Dexie {
  interactionStates!: Table<IDBState, string>;

  constructor() {
    super("SwimIDB");
    this.version(1).stores({ interactionStates: "&id" });
  }

  async getInteractionStates(env: Env) {
    return this.transaction("r", "interactionStates", async () => {
      const data = await this.interactionStates
        .filter((idbState) => idbState.interaction.env === env)
        .sortBy("interaction.submittedAt")
        .then((sorted) => sorted);
      return data.map((state) => this.deserializeState(state));
    }).catch((err) => {
      console.warn(err);
    });
  }

  addInteractionState(interactionState: InteractionState) {
    this.transaction("rw", "interactionStates", async () => {
      const serializedState: PersistedInteractionState =
        this.serializeState(interactionState);
      await this.interactionStates.add(
        {
          id: interactionState.interaction.id,
          ...serializedState,
        },
        interactionState.interaction.id,
      );
      const collection = await this.interactionStates
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
          await this.interactionStates.delete(collection[index].id);
        }
      }
    }).catch((err) => {
      console.warn("Fail to add interactionState into idb", err);
    });
  }

  private serializeState(state: InteractionState): PersistedInteractionState {
    return prepareInteractionState(state);
  }

  private deserializeState(state: PersistedInteractionState): InteractionState {
    return deserializeInteractionState(state);
  }
}

export const idb = new SwimIDB();

export function resetDatabase() {
  return idb.transaction("rw", idb.interactionStates, async () => {
    await Promise.all(idb.tables.map((table) => table.clear()));
  });
}
