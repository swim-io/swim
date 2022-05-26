import type { Table } from "dexie";
import Dexie from "dexie";


export class InterectionIDB extends Dexie {
  todoLists!: Table<TodoList, number>;
  todoItems!: Table<TodoItem, number>;
  constructor() {
    super("TodoDB");
    this.version(1).stores({
      todoLists: "++id",
      todoItems: "++id, todoListId",
    });
  }

  deleteList(todoListId: number) {
    return this.transaction("rw", this.todoItems, this.todoLists, () => {
      this.todoItems.where({ todoListId }).delete();
      this.todoLists.delete(todoListId);
    });
  }
}

export const db = new InterectionIDB();

db.on("populate", populate);

export function resetDatabase() {
  return db.transaction("rw", db.todoLists, db.todoItems, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    await populate();
  });
}
