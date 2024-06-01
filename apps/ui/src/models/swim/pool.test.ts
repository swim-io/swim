import type solana from "@solana/web3.js";
import { Env } from "@swim-io/core";
import type { EvmTx } from "@swim-io/evm";
import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ethers } from "ethers";
import { mock, mockDeep } from "jest-mock-extended";

import type { Config } from "../../config";
import { CONFIGS } from "../../config";
import { parsedWormholeRedeemEvmUnlockWrappedTx } from "../../fixtures/solana/txs";

import { getTokensByPool, isPoolTx } from "./pool";

describe("Pool tests", () => {
  describe("getTokensByPool", () => {
    it("returns tokens by pool id for local config", () => {
      const localConfig: Config = CONFIGS[Env.Local];
      const result = getTokensByPool(localConfig);

      localConfig.pools.forEach((pool) => {
        const tokenIds = result[pool.id].tokens.map((token) => token.id);
        expect(tokenIds).toEqual(pool.tokens);
        expect(result[pool.id].lpToken.id).toEqual(pool.lpToken);
      });
    });
  });

  describe("isPoolTx", () => {
    it("returns false for EVM tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ecosystemId = EvmEcosystemId.Ethereum;
      const txReceipt: ethers.providers.TransactionReceipt =
        mock<ethers.providers.TransactionReceipt>();
      const tx: EvmTx = {
        id: "string",
        timestamp: 123456789,
        ecosystemId: ecosystemId,
        original: txReceipt,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, tx)).toBe(false);
    });

    it("returns false, if not pool Solana tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const parsedTx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const tx: SolanaTx = {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        original: parsedTx,
        id: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, tx)).toBe(false);
    });

    it("returns true, if it's pool solana tx", () => {
      const contractAddress = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
      const parsedTx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const tx: SolanaTx = {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        original: parsedTx,
        id: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, tx)).toBe(true);
    });
  });
});
