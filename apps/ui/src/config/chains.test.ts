import { PublicKey } from "@solana/web3.js";
import { utils } from "ethers";

import { getUniqueSize } from "../utils";

import type { ChainSpec } from "./chains";
import { chains as chainsByEnv } from "./chains";
import type { Ecosystem } from "./ecosystem";
import { Protocol } from "./ecosystem";
import { Env } from "./env";

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
      const ecosystems = Object.values(chains).reduce<readonly Ecosystem[]>(
        (accumulator, chainSpecs) => [
          ...accumulator,
          ...chainSpecs.map((chainSpec: ChainSpec) => chainSpec.ecosystem),
        ],
        [],
      );
      const nUnique = getUniqueSize(ecosystems);
      expect(nUnique).toBe(ecosystems.length);
    });

    describe("Solana", () => {
      it("specifies a valid Wormhole bridge", () => {
        const { bridge } = chains[Protocol.Solana][0].wormhole;
        expect(() => new PublicKey(bridge)).not.toThrow();
      });

      it("specifies a valid Wormhole token bridge", () => {
        const { tokenBridge } = chains[Protocol.Solana][0].wormhole;
        expect(() => new PublicKey(tokenBridge)).not.toThrow();
      });

      it("specifies a valid token contract", () => {
        const { tokenContract } = chains[Protocol.Solana][0];
        expect(() => new PublicKey(tokenContract)).not.toThrow();
      });
    });

    describe("EVM", () => {
      it("specifies valid Wormhole bridges", () => {
        const bridges = chains[Protocol.Evm].map(
          (chain) => chain.wormhole.bridge,
        );
        expect(bridges.every((bridge) => bridge.startsWith("0x"))).toBe(true);
        expect(bridges.every((bridge) => utils.isAddress(bridge))).toBe(true);
      });

      it("specifies valid Wormhole token bridges", () => {
        const tokenBridges = chains[Protocol.Evm].map(
          (chain) => chain.wormhole.tokenBridge,
        );
        expect(
          tokenBridges.every((tokenBridge) => tokenBridge.startsWith("0x")),
        ).toBe(true);
        expect(
          tokenBridges.every((tokenBridge) => utils.isAddress(tokenBridge)),
        ).toBe(true);
      });
    });
  });
};

describe("Chains config", () => {
  generateSuite(Env.Mainnet);
  generateSuite(Env.Localnet);
});
