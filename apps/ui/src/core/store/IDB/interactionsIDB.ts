import type { Table } from "dexie";
import Dexie from "dexie";
import { StateStorage } from "zustand/middleware";
import { Interaction } from "../../../models";
/*

  db.open()
    .then((d) => console.log("opened", d))
    .catch((err) => console.log("err open", err));
  db.friends
    .add({ name: "Josephine", age: 21 })
    .then((data) => console.log("ADD Friends", data))
    .catch((err) => console.warn("ERR friends", err)); */
//  "++id,type,poolsId,env,submittedAt,signatureSetKeypairs,previousSignatureSetAddresses, connectedWallets, params, lpTokenSourceEcosystem",

export class InterectionsIDB extends Dexie {
  interactions!: Table<any, number>;
  friends!: Table<Friend, number>;
  constructor() {
    super("InterectionsIDB");
    this.version(1).stores({
      interactions: "++id,poolsId,env,submittedAt,params",
      friends: "++id,name,age",
    });
  }
}

export const db = new InterectionsIDB();

const IDBStorage: StateStorage = {
  getItem: async (name: string): Promise<any | null> => {
    // Exit early on server
    if (typeof indexedDB === "undefined") {
      return null;
    }

    return db.tables.entries() || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Exit early on server

    // await db.transaction(_, name).
    // set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await db.delete();
  },
};
