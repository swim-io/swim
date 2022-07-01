import { PublicKey } from "@solana/web3.js";
import { utils } from "ethers";

import { getUniqueSize } from "../utils";

import { EcosystemId } from "./ecosystem";
import { Env } from "./env";
import type { TokenSpec } from "./tokens";
import { tokens as tokensByEnv } from "./tokens";

const getAddressesForEcosystem = (
  tokens: readonly TokenSpec[],
  ecosystem: EcosystemId,
): readonly string[] =>
  tokens.reduce<readonly string[]>((addresses, { detailsByEcosystem }) => {
    const tokenDetails = detailsByEcosystem.get(ecosystem);
    return tokenDetails ? [...addresses, tokenDetails.address] : addresses;
  }, []);

const generateSuite = (env: Env): void => {
  const title = env.toString();
  const tokens = tokensByEnv[env];

  // eslint-disable-next-line jest/valid-title
  describe(title, () => {
    it("does not specify a token ID more than once", () => {
      const tokenIds = tokens.map((token) => token.id);
      const nUnique = getUniqueSize(tokenIds);
      expect(nUnique).toBe(tokenIds.length);
    });

    it("specifies only token IDs with the correct env prefix", () => {
      const tokenIds = tokens.map((token) => token.id);
      expect(
        tokenIds.every((id) => id.startsWith(`${env.toLowerCase()}-`)),
      ).toBe(true);
    });

    // NOTE: We may have to rethink this test if eg tokens on Ethereum/BNB can be deployed at the same address
    it("does not specify an address more than once", () => {
      const allAddresses = tokens.flatMap((token) =>
        [...token.detailsByEcosystem.values()].map(
          (details) => details.address,
        ),
      );
      const nUnique = getUniqueSize(allAddresses);
      expect(nUnique).toBe(allAddresses.length);
    });

    it("specifies valid Solana addresses", () => {
      const solanaAddresses = getAddressesForEcosystem(
        tokens,
        EcosystemId.Solana,
      );
      expect(() =>
        solanaAddresses.forEach((address) => new PublicKey(address)),
      ).not.toThrow();
    });

    it("specifies valid Ethereum addresses", () => {
      const ethereumAddresses = getAddressesForEcosystem(
        tokens,
        EcosystemId.Ethereum,
      );
      expect(
        ethereumAddresses.every((address) => address.startsWith("0x")),
      ).toBe(true);
      expect(ethereumAddresses.every(utils.isAddress)).toBe(true);
    });

    it("specifies valid BNB addresses", () => {
      const bnbAddresses = getAddressesForEcosystem(tokens, EcosystemId.Bnb);
      expect(bnbAddresses.every((address) => address.startsWith("0x"))).toBe(
        true,
      );
      expect(bnbAddresses.every(utils.isAddress)).toBe(true);
    });

    it("specifies token details for each token’s native Wormhole ecosystem", () => {
      const nativeEcosystemDetails = tokens.map((token) =>
        token.detailsByEcosystem.get(token.nativeEcosystem),
      );
      expect(nativeEcosystemDetails.every(Boolean)).toBe(true);
    });
  });
};

describe("Swim tokens config", () => {
  generateSuite(Env.Mainnet);
  generateSuite(Env.Localnet);
});
