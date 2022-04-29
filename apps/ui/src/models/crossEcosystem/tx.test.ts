import { BigNumber } from "@ethersproject/bignumber";

import { EcosystemId } from "../../config";

import type { BscTx, EthereumTx, SolanaTx } from "./tx";
import { isBscTx, isEthereumTx, isEvmTx, isSolanaTx } from "./tx";

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
});
