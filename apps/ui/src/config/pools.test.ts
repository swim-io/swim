import { PublicKey } from "@solana/web3.js";
import { getUniqueSize } from "@swim-io/utils";

import { isSolanaPool } from "../models";

import { Env } from "./env";
import { POOLS as poolsByEnv } from "./pools";
import type { SolanaPoolSpec } from "./pools";
import { TOKENS as tokensByEnv } from "./tokens";

const generateSuite = (env: Env): void => {
  const title = env.toString();
  const pools = poolsByEnv[env];
  const tokens = tokensByEnv[env];
  const solanaPools = pools.filter(isSolanaPool);

  // eslint-disable-next-line jest/valid-title
  describe(title, () => {
    it("does not specify a pool ID more than once", () => {
      const poolIds = pools.map((pool) => pool.id);
      const nUnique = getUniqueSize(poolIds);
      expect(nUnique).toBe(poolIds.length);
    });

    it("does not specify a display name more than once", () => {
      const poolDisplayNames = pools.map((pool) => pool.displayName);
      const nUnique = getUniqueSize(poolDisplayNames);
      expect(nUnique).toBe(poolDisplayNames.length);
    });

    it("does not specify a pool address more than once", () => {
      const poolAddresses = pools.map((pool) => pool.address);
      const nUnique = getUniqueSize(poolAddresses);
      expect(nUnique).toBe(poolAddresses.length);
    });

    it("specifies valid pool addresses", () => {
      const poolAddresses = pools.map((pool) => pool.address);
      expect(() =>
        poolAddresses.forEach((address) => new PublicKey(address)),
      ).not.toThrow();
    });

    it("does not specify an LP token ID more than once", () => {
      const lpTokens = pools.map((pool) => pool.lpToken);
      const nUnique = getUniqueSize(lpTokens);
      expect(nUnique).toBe(lpTokens.length);
    });

    it("specifies known LP tokens", () => {
      const lpTokens = pools.map((pool) => pool.lpToken);
      const knownTokens = lpTokens.map((tokenId) =>
        tokens.find((token) => token.id === tokenId),
      );
      expect(knownTokens.every(Boolean)).toBe(true);
    });

    it("specifies known pool tokens", () => {
      const poolTokens = pools.flatMap((pool) => pool.tokens);
      const knownTokens = poolTokens.map((tokenId) =>
        tokens.find((token) => token.id === tokenId),
      );
      expect(knownTokens.every(Boolean)).toBe(true);
    });

    it("specifies valid contract addresses for Solana pool", () => {
      const contractAddresses = solanaPools.map((pool) => pool.contract);
      expect(() =>
        contractAddresses.forEach((address) => new PublicKey(address)),
      ).not.toThrow();
    });

    it("does not specify a token account address more than once for Solana pool", () => {
      const tokenAccountAddresses = solanaPools
        .filter((pool) => !pool.isLegacyPool)
        .flatMap((pool) => [...pool.tokenAccounts.values()]);
      const nUnique = getUniqueSize(tokenAccountAddresses);
      expect(nUnique).toBe(tokenAccountAddresses.length);
    });

    it("specifies valid token account addresses for Solana pool", () => {
      const tokenAccountAddresses = solanaPools.flatMap((pool) => [
        ...pool.tokenAccounts.values(),
      ]);
      expect(() =>
        tokenAccountAddresses.forEach((address) => new PublicKey(address)),
      ).not.toThrow();
    });

    it("should have token account addresses for each token in Solana pool", () => {
      const hasValidTokenAccounts = (pool: SolanaPoolSpec) =>
        pool.tokens.every((token) => pool.tokenAccounts.has(token));
      expect(solanaPools.every(hasValidTokenAccounts)).toBe(true);
    });
  });
};

describe("Swim pools config", () => {
  generateSuite(Env.Mainnet);
  generateSuite(Env.Localnet);
});
