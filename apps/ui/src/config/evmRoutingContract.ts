import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

export const EVM_ROUTING_CONTRACT: ReadonlyRecord<Env, string> = {
  [Env.Mainnet]: "",
  [Env.Devnet]: "0xa33E4d9624608c468FE5466dd6CC39cE1Da4FF78",
  [Env.Local]: "",
  [Env.Custom]: "",
};
