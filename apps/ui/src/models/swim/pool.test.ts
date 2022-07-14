import type solana from "@solana/web3.js";
import type { ethers } from "ethers";
import { mock, mockDeep } from "jest-mock-extended";

import type { Config } from "../../config";
import { CONFIGS, EcosystemId } from "../../config";
import { Env } from "../../config/env";
import { parsedWormholeRedeemEvmUnlockWrappedTx } from "../../fixtures/solana/txs";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import { getTokensByPool, isPoolTx } from "./pool";

describe("Pool tests", () => {
  describe("getTokensByPool", () => {
    it("returns tokens by pool id for localnet", () => {
      const localnetConfig: Config = CONFIGS[Env.Localnet];
      const result = getTokensByPool(localnetConfig);

      localnetConfig.pools.forEach((pool) => {
        const tokenIds = result[pool.id].tokens.map((token) => token.id);
        expect(tokenIds).toEqual(pool.tokens);
        expect(result[pool.id].lpToken.id).toEqual(pool.lpToken);
      });
    });
  });

  describe("isPoolTx", () => {
    it("returns false for EVM tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ecosystemId = ETHEREUM_ECOSYSTEM_ID;
      const txResponse: ethers.providers.TransactionResponse =
        mock<ethers.providers.TransactionResponse>();
      const txReceipt: ethers.providers.TransactionReceipt =
        mock<ethers.providers.TransactionReceipt>();
      const tx: EvmTx = {
        txId: "string",
        timestamp: 123456789,
        ecosystem: ecosystemId,
        txResponse: txResponse,
        txReceipt: txReceipt,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, tx)).toBe(false);
    });

    it("returns false, if not pool Solana tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ptx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: SOLANA_ECOSYSTEM_ID,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBe(false);
    });

    it("returns true, if it's pool solana tx", () => {
      const contractAddress = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
      const ptx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: SOLANA_ECOSYSTEM_ID,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBe(true);
    });
  });
});
