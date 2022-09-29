import { Env } from "@swim-io/core";
import { getRecordValues, getUniqueSize } from "@swim-io/utils";

import type { ChainSpec } from "./chains";
import { CHAINS as chainsByEnv } from "./chains";
import type { EcosystemId } from "./ecosystem";
import { Protocol } from "./ecosystem";

const generateSuite = (env: Env): void => {
  const title = env.toString();
  const chains = chainsByEnv[env];

  // eslint-disable-next-line jest/valid-title
  describe(title, () => {
    it("specifies exactly one Solana chain", () => {
      const solanaChains = chains[Protocol.Solana];
      expect(solanaChains.length).toBe(1);
    });

    it("specifies no more than one chain per ecosystem", () => {
      const ecosystems = getRecordValues<Protocol, readonly ChainSpec[]>(
        chains,
      ).reduce<readonly EcosystemId[]>(
        (accumulator, chainSpecs) => [
          ...accumulator,
          ...chainSpecs.map((chainSpec) => chainSpec.ecosystem),
        ],
        [],
      );
      const nUnique = getUniqueSize(ecosystems);
      expect(nUnique).toBe(ecosystems.length);
    });
  });
};

describe("Chains config", () => {
  generateSuite(Env.Mainnet);
  generateSuite(Env.Local);
});
