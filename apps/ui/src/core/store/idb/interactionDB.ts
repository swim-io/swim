import Dexie, { Table } from "dexie";
import { StateStorage } from "zustand/middleware";
import { InteractionState } from "../../../models";

export interface InteractionWrapper {
  state: InteractionState;
  id: string;
}

export class InteractionDB extends Dexie {
  interactionStates!: Table<InteractionWrapper, string>;

  constructor() {
    super("InteractionDB");
    this.version(1).stores({
      interactionStates: "&id,state",
    });
  }

  async resetDatabase() {
    await db.transaction("rw", "interactionStates", () => {
      this.interactionStates.clear();
    });
  }
}

const db = new InteractionDB();

export const InteractionIDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!db.isOpen()) {
      try {
        await db.open();
        const data = await db.interactionStates.toArray();
        const sortedData = [...data]
          ?.sort(
            (a, b) =>
              a.state.interaction.submittedAt - b.state.interaction.submittedAt,
          )
          .map((interactionState) => interactionState.state);
        return JSON.stringify(sortedData);
      } catch (err) {
        console.warn("Fail to get the data from IDB", err);
        return null;
      }
    }
    console.warn("DB is not open !");
    return null;
  },
  setItem: async (name: string, value: string) => {
    const { interactionStates } = JSON.parse(value).state;
    if (!db.isOpen()) {
      await db.open();
      await Promise.all(
        interactionStates?.map((element: InteractionState) => {
          db.interactionStates
            .add(
              { state: element, id: element.interaction.id },
              element.interaction.id,
            )
            .catch((err) => {
              console.warn("Error adding interactionState in IDB", err);
              // throw err;
            });
        }),
      );
    }
  },
  removeItem: async (name: string) => {
    if (!db.isOpen()) {
      try {
        await db.open();
        await db.resetDatabase();
      } catch (err) {
        console.warn("Fail to reset IDB");
        throw err;
      }
    }
  },
};
