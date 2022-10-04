import type { Propeller } from "./artifacts/propeller";
import propeller from "./artifacts/propeller.json";
import type { TwoPool } from "./artifacts/two_pool";
import twoPool from "./artifacts/two_pool.json";

export type { Propeller } from "./artifacts/propeller";
export type { TwoPool } from "./artifacts/two_pool";

export const idl = {
  propeller: propeller as Propeller,
  twoPool: twoPool as TwoPool,
};

export * from "./utils";
