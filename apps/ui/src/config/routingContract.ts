import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

export const ROUTING_CONTRACT_ADDRESS: ReadonlyRecord<Env, string> = {
  [Env.Mainnet]: "",
  [Env.Devnet]: "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375",
  [Env.Local]: "",
  [Env.Custom]: "",
};
