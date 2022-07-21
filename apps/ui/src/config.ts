import type { EcosystemConfig, ReadonlyRecord } from "@swim-io/core-types";
import { bnb, ethereum } from "@swim-io/evm";
import { solana } from "@swim-io/solana";

export const EVM_ECOSYSTEMS = [ethereum, bnb];
export const EVM_ECOSYSTEM_IDS = EVM_ECOSYSTEMS.map(
  (ecosystem) => ecosystem.id,
);
export const ECOSYSTEMS = [solana, ...EVM_ECOSYSTEMS];
export const ECOSYSTEM_IDS = ECOSYSTEMS.map((ecosystem) => ecosystem.id);
export const ECOSYSTEMS_BY_ID = ECOSYSTEMS.reduce<
  ReadonlyRecord<string, EcosystemConfig | undefined>
>(
  (accumulator, ecosystem) => ({
    ...accumulator,
    [ecosystem.id]: ecosystem,
  }),
  {},
);

export const isEvmEcosystemId = (ecosystemId: string): boolean =>
  EVM_ECOSYSTEM_IDS.includes(ecosystemId);

export const isEcosystemEnabled = (ecosystemId: string): boolean => {
  switch (ecosystemId) {
    case solana.id:
    case ethereum.id:
    case bnb.id:
      return true;
    default:
      return false;
  }
};
