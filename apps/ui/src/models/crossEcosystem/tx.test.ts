import { BigNumber } from "@ethersproject/bignumber";

import { EcosystemId } from "../../config";

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
    tx: {
      slot: 782648,
      transaction: {
        signatures: [],
        message: {
          accountKeys: [],
          instructions: [],
          recentBlockhash: "4T4Pnrtr1A15QRx69DukxvABoU2RiGmGeNAwaqiiAxyp",
        },
      },
      meta: null,
    },
  };

  const ethereumTx: EthereumTx = {
    ecosystem: EcosystemId.Ethereum,
    txId: "0x743087e871039d66b82fcb2cb719f6a541e650e05735c32c1be871ef9ae9a456",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    tx: {
      to: "",
      from: "",
      contractAddress: "",
      transactionIndex: 1,
      gasUsed: BigNumber.from(1),
      logsBloom: "",
      blockHash: "",
      transactionHash: "",
      logs: [],
      blockNumber: 782648,
      confirmations: 1,
      cumulativeGasUsed: BigNumber.from(1),
      effectiveGasPrice: BigNumber.from(1),
      byzantium: true,
      type: 0,
    },
  };

  const bscTx: BscTx = {
    ...ethereumTx,
    ecosystem: EcosystemId.Bsc,
  };

  const txWithSolanaId: TxWithTokenId = {
    tokenId: "SOL",
    tx: solanaTx,
  };

  const txWithEthereumId: TxWithTokenId = {
    tokenId: "ETH",
    tx: ethereumTx,
  };

  describe("isSolanaTx", () => {
    it("returns true if the ecosystem is Solana", () => {
      expect(isSolanaTx(solanaTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Solana", () => {
      expect(isSolanaTx(ethereumTx)).toBe(false);
      expect(isSolanaTx(bscTx)).toBe(false);
    });
  });

  describe("isEthereumTx", () => {
    it("returns true if the ecosystem is Ethereum", () => {
      expect(isEthereumTx(ethereumTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Ethereum", () => {
      expect(isEthereumTx(solanaTx)).toBe(false);
      expect(isEthereumTx(bscTx)).toBe(false);
    });
  });

  describe("isBscTx", () => {
    it("returns true if the ecosystem is Bsc", () => {
      expect(isBscTx(bscTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Bsc", () => {
      expect(isBscTx(solanaTx)).toBe(false);
      expect(isBscTx(ethereumTx)).toBe(false);
    });
  });

  describe("isEvmTx", () => {
    it("returns true if the ecosystem is Evm", () => {
      expect(isEvmTx(ethereumTx)).toBe(true);
      expect(isEvmTx(bscTx)).toBe(true);
    });

    it("returns false if the ecosystem is not Evm", () => {
      expect(isEvmTx(solanaTx)).toBe(false);
    });
  });

  describe("groupTxsByTokenId", () => {
    it("returns object of txs grouped by tokenId as a key", () => {
      const result = { SOL: [solanaTx], ETH: [ethereumTx] };
      expect(groupTxsByTokenId([txWithSolanaId, txWithEthereumId])).toEqual(
        result,
      );
    });
    it("returns one object with tokenId, if single element list", () => {
      expect(groupTxsByTokenId([txWithSolanaId])).toEqual({ SOL: [solanaTx] });
    });
    it("returns empty object, if argument is an empty array", () => {
      expect(groupTxsByTokenId([])).toEqual({});
    });
  });

  describe("deduplicateTxsByTokenId", () => {
    const txBySolanaId = { SOL: [solanaTx] };
    const txByEthereumId = { ETH: [ethereumTx] };

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
