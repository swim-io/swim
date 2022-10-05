import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

export const EVM_ROUTING_CONTRACT: ReadonlyRecord<Env, string> = {
  [Env.Mainnet]: "",
  [Env.Testnet]: "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4",
  [Env.Local]: "",
  [Env.Custom]: "",
};
