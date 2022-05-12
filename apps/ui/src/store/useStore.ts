import create from "zustand";
import type { GetState, SetState } from "zustand";

// import { createNotificationSlice } from "./slices/createNotificationSlice";

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>,
) => T;

const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  // ...createNotificationSlice(set, get),
});

const useStore = create(createRootSlice);

export default useStore;
