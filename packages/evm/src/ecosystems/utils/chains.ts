import type { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

type ChainId = Partial<ReadonlyRecord<Env, number>>;

/** function to keep a narrower type while make sure the input is ChainId */
export const createChainId = <T extends ChainId>(chainId: T): T => chainId;
