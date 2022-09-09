import type { ReadonlyRecord } from "@swim-io/utils";

import type { EvmEcosystemConfig, EvmEcosystemId } from "../protocol";

import { acala } from "./acala";
import { aurora } from "./aurora";
import { avalanche } from "./avalanche";
import { bnb } from "./bnb";
import { ethereum } from "./ethereum";
import { fantom } from "./fantom";
import { karura } from "./karura";
import { polygon } from "./polygon";

export * from "./acala";
export * from "./aurora";
export * from "./avalanche";
export * from "./bnb";
export * from "./ethereum";
export * from "./fantom";
export * from "./karura";
export * from "./polygon";

export const EVM_ECOSYSTEMS: ReadonlyRecord<
  EvmEcosystemId,
  EvmEcosystemConfig<EvmEcosystemId>
> = {
  ethereum,
  bnb,
  polygon,
  avalanche,
  aurora,
  fantom,
  karura,
  acala,
} as const;
