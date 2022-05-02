import type solana from "@solana/web3.js";
import type { ethers } from "ethers";
import { mock, mockDeep } from "jest-mock-extended";

import type { Config } from "../../config";
import { EcosystemId, configs } from "../../config";
import { Env } from "../../config/env";
import { tokens } from "../../config/tokens";
import { parsedWormholeRedeemEvmUnlockWrappedTx } from "../../fixtures/solana/txs";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import { getTokensByPool, isPoolTx } from "./pool";

describe("Pool tests", () => {
  describe("getTokensByPool", () => {
    it("should return tokens by pool id for mainnet", () => {
      const mainnetConfig: Config = configs[Env.Mainnet];
      const res = getTokensByPool(mainnetConfig);
      const poolId = "hexapool";
      expect(Object.keys(res)[0]).toEqual(poolId);
      expect(Object.keys(res[poolId])).toEqual(["tokens", "lpToken"]);

      const allTokens = [...res[poolId]["tokens"], res[poolId]["lpToken"]];
      expect(allTokens.length).toEqual(tokens[Env.Mainnet].length);
      allTokens.forEach((t) => {
        const t2 = tokens[Env.Mainnet].find((emt) => emt.id === t.id);
        expect(t).toEqual(t2);
      });
    });
    it("should return tokens by pool id for devnnet", () => {
      const devnetConfig: Config = configs[Env.Devnet];
      const res = getTokensByPool(devnetConfig);
      const poolId = "hexapool";
      expect(Object.keys(res)[0]).toEqual(poolId);
      expect(Object.keys(res[poolId])).toEqual(["tokens", "lpToken"]);

      const allTokens = [...res[poolId]["tokens"], res[poolId]["lpToken"]];

      allTokens.forEach((t) => {
        const t2 = tokens[Env.Devnet].find((emt) => emt.id === t.id);
        expect(t).toEqual(t2);
      });
    });
    it("should return tokens by pool id for localnet", () => {
      const localnetConfig: Config = configs[Env.Localnet];
      const res = getTokensByPool(localnetConfig);
      const poolId = "hexapool";
      expect(Object.keys(res)[0]).toEqual(poolId);
      expect(Object.keys(res[poolId])).toEqual(["tokens", "lpToken"]);

      const allTokens = [...res[poolId]["tokens"], res[poolId]["lpToken"]];

      allTokens.forEach((t) => {
        const t2 = tokens[Env.Localnet].find((emt) => emt.id === t.id);
        expect(t).toEqual(t2);
      });
    });
    it("should return tokens by pool id for customnet", () => {
      const customnetConfig: Config = configs[Env.CustomLocalnet];
      const res = getTokensByPool(customnetConfig);
      const poolId = "hexapool";
      expect(Object.keys(res)[0]).toEqual(poolId);
      expect(Object.keys(res[poolId])).toEqual(["tokens", "lpToken"]);

      const allTokens = [...res[poolId]["tokens"], res[poolId]["lpToken"]];

      allTokens.forEach((t) => {
        const t2 = tokens[Env.CustomLocalnet].find((emt) => emt.id === t.id);
        expect(t).toEqual(t2);
      });
    });
  });

  describe("isPoolTx", () => {
    it("should return false if not solana pool tx", () => {
      const contractAddr = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ecosystemId = EcosystemId.Ethereum;
      const tr: ethers.providers.TransactionResponse =
        mock<ethers.providers.TransactionResponse>();
      const txRec: ethers.providers.TransactionReceipt =
        mock<ethers.providers.TransactionReceipt>();
      const tx: EvmTx = {
        txId: "string",
        timestamp: 123456789,
        ecosystem: ecosystemId,
        txResponse: tr,
        txReceipt: txRec,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddr, tx)).toBeFalsy();
    });

    it("should return false, if not pool Solana tx", () => {
      const contractAddr = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      let ptx: solana.ParsedTransactionWithMeta =
        mockDeep<solana.ParsedTransactionWithMeta>();
      ptx = {
        ...ptx,
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddr, txs)).toBeFalsy();
    });

    it("should return true, if it's pool solana tx", () => {
      const contractAddr = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
      let ptx: solana.ParsedTransactionWithMeta =
        mockDeep<solana.ParsedTransactionWithMeta>();
      ptx = {
        ...ptx,
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystem: EcosystemId.Solana,
        parsedTx: ptx,
        txId: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddr, txs)).toBeTruthy();
    });
  });
});
