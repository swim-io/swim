import Dexie, { Table } from "dexie";
import { StateStorage } from "zustand/middleware";
import { MOCK_INTERACTION_STATE } from "../../../fixtures/swim/interactionState";
import { InteractionState } from "../../../models";

export interface InteractionWrapper {
  state: string;
}

export class InteractionDB extends Dexie {
  interactionStates!: Table<InteractionWrapper, number>;

  constructor() {
    super("InteractionDB");
    this.version(1).stores({
      interactionStates: "++id, state",
    });
    this.on("populate", () => this.populate());
  }

  async populate() {
    await db.interactionStates.add({
      state: JSON.stringify(MOCK_INTERACTION_STATE),
    });
  }

  async resetDatabase() {
    await db.transaction("rw", "interactionStates", () => {
      this.interactionStates.clear();
      // this.populate();
    });
  }
}

const db = new InteractionDB();

export const InteractionIDBStorage: StateStorage = {
  getItem: async (name: string = "InteractionDB"): Promise<string | null> => {
    console.log("GET ITEM", name);
    if (!db.isOpen()) {
      await db.open();
      await db.populate();
      try {
        const it = await db.interactionStates.toArray();
        console.log("Interacion in storage", it);
        return it[0].state;
      } catch (err) {
        console.warn("ERROR FETCH", err);
      }
    }
    return null;
  },
  setItem: async (name: string, value: string) => {
    console.log("SET ITEM", name, value);
  },
  removeItem: async (name: string) => {
    console.log("REMOVE ITEM", name);
    await db.resetDatabase();
  },
};
