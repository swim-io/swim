import type solana from "@solana/web3.js";
import type { ethers } from "ethers";
import { mock, mockDeep } from "jest-mock-extended";

import type { Config } from "../../config";
import { EcosystemId, configs } from "../../config";
import { Env } from "../../config/env";
import { parsedWormholeRedeemEvmUnlockWrappedTx } from "../../fixtures/solana/txs";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import { getTokensByPool, isPoolTx } from "./pool";

describe("Pool tests", () => {
  describe("getTokensByPool", () => {
    it("returns tokens by pool id for localnet", () => {
      const localnetConfig: Config = configs[Env.Localnet];
      const result = getTokensByPool(localnetConfig);

      localnetConfig.pools.forEach((pool) => {
        const tokenKeys = pool.tokenAccounts.keys();
        const tokenIds = [...tokenKeys, pool.lpToken];
        const expectedPoolTokenIds = [
          ...result[pool.id].tokens,
          result[pool.id].lpToken,
        ].map((token) => token.id);
        expect(tokenIds).toEqual(expectedPoolTokenIds);
      });
    });
  });

  describe("isPoolTx", () => {
    it("returns false for EVM tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ecosystemId = EcosystemId.Ethereum;
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
      const mockParsedTx: solana.ParsedTransactionWithMeta =
        mockDeep<solana.ParsedTransactionWithMeta>();
      const ptx = {
        ...mockParsedTx,
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBe(false);
    });

    it("returns true, if it's pool solana tx", () => {
      const contractAddress = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
      const mockParsedTx: solana.ParsedTransactionWithMeta =
        mockDeep<solana.ParsedTransactionWithMeta>();
      const ptx = {
        ...mockParsedTx,
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBeTruthy();
    });
  });
});
