/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { act } from "@testing-library/react-hooks";
import actualCreate from "zustand";

import type { TokenSpec } from "./config";
import { Env, tokens } from "./config";

export const mockOf = <T>(v: (...any: any) => T): jest.Mock<Partial<T>> =>
  v as unknown as jest.Mock<Partial<T>>;

export const findLocalnetTokenById = (tokenId: string): TokenSpec =>
  tokens[Env.Localnet].find(({ id }) => id === tokenId)!;

// helper function for store creation
const storeResetFns = new Set();

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (createState: any) => {
  const store = actualCreate(createState);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

// Reset all stores after each test run
afterEach(() => {
  act(() => storeResetFns.forEach((resetFn: any) => resetFn()));
});
