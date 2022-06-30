import type { ethers } from "ethers";
import { mock } from "jest-mock-extended";

import { EcosystemId } from "../../config";
import { parsedSwimSwapTx } from "../../fixtures/solana/txs";

import type { BscTx, EthereumTx, SolanaTx, TxWithTokenId } from "./tx";
import {
  deduplicateTxsByTokenId,
  groupTxsByTokenId,
  isBscTx,
  isEthereumTx,
  isEvmTx,
  isSolanaTx,
} from "./tx";

describe("Cross-ecosystem tx", () => {
  const defaultTimestamp = 1642762608;
  const defaultInteractionId = "2dd7602f7db6617697ecf04ac4aac930";
  const solanaTx: SolanaTx = {
    ecosystem: EcosystemId.Solana,
    txId: "34PhSGJi3XboZEhZEirTM6FEh1hNiYHSio1va1nNgH7S9LSNJQGSAiizEyVbgbVJzFjtsbyuJ2WijN53FSC83h7h",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    parsedTx: parsedSwimSwapTx,
  };
  const solanaTx2: SolanaTx = {
    ecosystem: EcosystemId.Solana,
    txId: "34PhSGJi3XboZEhZEirTM6FEh1hNiYHSio1va1nNgH7S9LSNJQGSAiizEyVbgbVJzFjtsbyuJ2WijN53FSC83h7a",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    parsedTx: parsedSwimSwapTx,
  };

  const ethereumTx: EthereumTx = {
    ecosystem: EcosystemId.Ethereum,
    txId: "0x743087e871039d66b82fcb2cb719f6a541e650e05735c32c1be871ef9ae9a456",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    txResponse: mock<ethers.providers.TransactionResponse>(),
    txReceipt: mock<ethers.providers.TransactionReceipt>(),
  };
  const ethereumTx2: EthereumTx = {
    ecosystem: EcosystemId.Ethereum,
    txId: "0x743087e871039d66b82fcb2cb719f6a541e650e05735c32c1be871ef9ae9a457",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    txResponse: mock<ethers.providers.TransactionResponse>(),
    txReceipt: mock<ethers.providers.TransactionReceipt>(),
  };

  const bnbTx: BscTx = {
    ...ethereumTx,
    ecosystem: EcosystemId.Bnb,
  };
  const bnbTx2: BscTx = {
    ...ethereumTx2,
    ecosystem: EcosystemId.Bnb,
  };

  const txWithSolanaId: TxWithTokenId = {
    tokenId: "mainnet-solana-usdc",
    tx: solanaTx,
  };

  const txWithEthereumId: TxWithTokenId = {
    tokenId: "mainnet-ethereum-usdc",
    tx: ethereumTx,
  };

  const txWithBinanceId: TxWithTokenId = {
    tokenId: "mainnet-bnb-usdt",
    tx: bnbTx,
  };
  const txWithBinanceUsdcId: TxWithTokenId = {
    tokenId: "mainnet-bnb-usdc",
    tx: bnbTx,
  };

  describe("isSolanaTx", () => {
    it("returns true if the ecosystem is Solana", () => {
      expect(isSolanaTx(solanaTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Solana", () => {
      expect(isSolanaTx(ethereumTx)).toBe(false);
      expect(isSolanaTx(bnbTx)).toBe(false);
    });
  });

  describe("isEthereumTx", () => {
    it("returns true if the ecosystem is Ethereum", () => {
      expect(isEthereumTx(ethereumTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Ethereum", () => {
      expect(isEthereumTx(solanaTx)).toBe(false);
      expect(isEthereumTx(bnbTx)).toBe(false);
    });
  });

  describe("isBscTx", () => {
    it("returns true if the ecosystem is Bsc", () => {
      expect(isBscTx(bnbTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Bsc", () => {
      expect(isBscTx(solanaTx)).toBe(false);
      expect(isBscTx(ethereumTx)).toBe(false);
    });
  });

  describe("isEvmTx", () => {
    it("returns true if the ecosystem is Evm", () => {
      expect(isEvmTx(ethereumTx)).toBe(true);
      expect(isEvmTx(bnbTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Evm", () => {
      expect(isEvmTx(solanaTx)).toBe(false);
    });
  });

  describe("groupTxsByTokenId", () => {
    it("returns object of txs grouped by tokenId as a key", () => {
      const expected = {
        "mainnet-solana-usdc": [solanaTx, solanaTx],
        "mainnet-ethereum-usdc": [ethereumTx, ethereumTx],
        "mainnet-bnb-usdt": [bnbTx],
        "mainnet-bnb-usdc": [bnbTx],
      };
      expect(
        groupTxsByTokenId([
          txWithBinanceId,
          txWithBinanceUsdcId,
          txWithSolanaId,
          txWithEthereumId,
          txWithSolanaId,
          txWithEthereumId,
        ]),
      ).toEqual(expected);
    });
    it("returns one object with tokenId, if single element list", () => {
      expect(groupTxsByTokenId([txWithSolanaId])).toEqual({
        "mainnet-solana-usdc": [solanaTx],
      });
      expect(groupTxsByTokenId([txWithBinanceId])).toEqual({
        "mainnet-bnb-usdt": [bnbTx],
      });
      expect(groupTxsByTokenId([txWithEthereumId])).toEqual({
        "mainnet-ethereum-usdc": [ethereumTx],
      });
    });
    it("returns empty object, if argument is an empty array", () => {
      expect(groupTxsByTokenId([])).toEqual({});
    });
  });

  describe("deduplicateTxsByTokenId", () => {
    const txBySolanaId = {
      "mainnet-solana-usdc": [solanaTx, solanaTx2],
    };
    const txByEthereumId = {
      "mainnet-ethereum-usdc": [ethereumTx, ethereumTx2],
    };
    const txByEthereumId2 = {
      "mainnet-ethereum-usdt": [ethereumTx2, ethereumTx, ethereumTx],
    };
    const txByBinanceId = { "mainnet-bnb-usdt": [bnbTx, bnbTx2] };

    it("returns object of all txs, if no duplicates", () => {
      expect(deduplicateTxsByTokenId(txBySolanaId, txByEthereumId)).toEqual({
        ...txBySolanaId,
        ...txByEthereumId,
      });
    });
    it("returns object with one tokenId, if there are duplicates", () => {
      expect(deduplicateTxsByTokenId(txBySolanaId, txBySolanaId)).toEqual({
        ...txBySolanaId,
      });
      expect(deduplicateTxsByTokenId(txByEthereumId, txByEthereumId2)).toEqual({
        ...txByEthereumId,
        ...txByEthereumId2,
      });
      expect(deduplicateTxsByTokenId(txByBinanceId, txByBinanceId)).toEqual({
        ...txByBinanceId,
      });
    });
    it("returns empty object, if arguments are empty objects", () => {
      expect(deduplicateTxsByTokenId({}, {})).toEqual({});
    });
    it("returns existing tx, if one of arguments is empty objects", () => {
      expect(deduplicateTxsByTokenId({}, txByEthereumId)).toEqual({
        ...txByEthereumId,
      });
    });
  });
});
