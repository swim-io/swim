import type { ethers } from "ethers";
import { mock } from "jest-mock-extended";

import { EcosystemId } from "../../config";
import { parsedSwimSwapTx } from "../../fixtures/solana/txs";

import type { BnbTx, EthereumTx, SolanaTx } from "./tx";
import { isBnbTx, isEthereumTx, isEvmTx, isSolanaTx } from "./tx";

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

  const ethereumTx: EthereumTx = {
    ecosystem: EcosystemId.Ethereum,
    txId: "0x743087e871039d66b82fcb2cb719f6a541e650e05735c32c1be871ef9ae9a456",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    txResponse: mock<ethers.providers.TransactionResponse>(),
    txReceipt: mock<ethers.providers.TransactionReceipt>(),
  };

  const bnbTx: BnbTx = {
    ...ethereumTx,
    ecosystem: EcosystemId.Bnb,
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

  describe("isBnbTx", () => {
    it("returns true if the ecosystem is BNB", () => {
      expect(isBnbTx(bnbTx)).toBe(true);
    });

    it("returns false if the ecosystem is not BNB", () => {
      expect(isBnbTx(solanaTx)).toBe(false);
      expect(isBnbTx(ethereumTx)).toBe(false);
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
});
