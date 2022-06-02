import type { Table } from "dexie";
import Dexie from "dexie";

import type { Env } from "../../../config";
import type { InteractionState } from "../../../models";

import type { PersistedInteractionState } from "./helpers";
import {
  deserializeInteractionStates,
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
    return this.transaction("rw", "interactionStates", async () => {
      const data = await this.interactionStates
        .filter((idbState) => idbState.interaction.env === env)
        .toArray();
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
      const size = await this.interactionStates.count();
      if (size > MAX_STORED_INTERACTIONS) {
        const diff = size - MAX_STORED_INTERACTIONS;
        const collection = await this.interactionStates.toArray();
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
    return deserializeInteractionStates(state);
  }
}

export const idb = new SwimIDB();

export function resetDatabase() {
  return idb.transaction("rw", idb.interactionStates, async () => {
    await Promise.all(idb.tables.map((table) => table.clear()));
  });
}
