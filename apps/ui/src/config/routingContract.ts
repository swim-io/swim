import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EvmEcosystemId } from "./ecosystem";
import { EcosystemId } from "./ecosystem";

export type RoutingContractAddress = ReadonlyRecord<EvmEcosystemId, string>;

// TODO: update
const MAINNET_ROUTING_CONTRACT_ADDRESS: RoutingContractAddress = {
  [EcosystemId.Acala]: "",
  [EcosystemId.Aurora]: "",
  [EcosystemId.Avalanche]: "",
  [EcosystemId.Bnb]: "",
  [EcosystemId.Ethereum]: "",
  [EcosystemId.Fantom]: "",
  [EcosystemId.Karura]: "",
  [EcosystemId.Polygon]: "",
};

// TODO: update
const DEVNET_ROUTING_CONTRACT_ADDRESS: RoutingContractAddress = {
  [EcosystemId.Acala]: "",
  [EcosystemId.Aurora]: "",
  [EcosystemId.Avalanche]: "",
  [EcosystemId.Bnb]: "",
  [EcosystemId.Ethereum]: "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375",
  [EcosystemId.Fantom]: "",
  [EcosystemId.Karura]: "",
  [EcosystemId.Polygon]: "",
};

// TODO: update
const LOCAL_ROUTING_CONTRACT_ADDRESS: RoutingContractAddress = {
  [EcosystemId.Acala]: "",
  [EcosystemId.Aurora]: "",
  [EcosystemId.Avalanche]: "",
  [EcosystemId.Bnb]: "",
  [EcosystemId.Ethereum]: "",
  [EcosystemId.Fantom]: "",
  [EcosystemId.Karura]: "",
  [EcosystemId.Polygon]: "",
};

export const ROUTING_CONTRACT_ADDRESS: ReadonlyRecord<
  Env,
  RoutingContractAddress
> = {
  [Env.Mainnet]: MAINNET_ROUTING_CONTRACT_ADDRESS,
  [Env.Devnet]: DEVNET_ROUTING_CONTRACT_ADDRESS,
  [Env.Local]: LOCAL_ROUTING_CONTRACT_ADDRESS,
  [Env.Custom]: LOCAL_ROUTING_CONTRACT_ADDRESS,
};
