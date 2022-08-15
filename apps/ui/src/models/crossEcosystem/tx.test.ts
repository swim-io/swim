import type { EvmTx } from "@swim-io/evm";
import { EvmEcosystemId, isEvmTx } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, isSolanaTx } from "@swim-io/solana";
import type { ethers } from "ethers";
import { mock } from "jest-mock-extended";

import { parsedSwimSwapTx } from "../../fixtures/solana/txs";

describe("Cross-ecosystem tx", () => {
  const defaultTimestamp = 1642762608;
  const defaultInteractionId = "2dd7602f7db6617697ecf04ac4aac930";
  const solanaTx: SolanaTx = {
    ecosystemId: SOLANA_ECOSYSTEM_ID,
    id: "34PhSGJi3XboZEhZEirTM6FEh1hNiYHSio1va1nNgH7S9LSNJQGSAiizEyVbgbVJzFjtsbyuJ2WijN53FSC83h7h",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    parsedTx: parsedSwimSwapTx,
  };

  const ethereumTx: EvmTx = {
    ecosystemId: EvmEcosystemId.Ethereum,
    id: "0x743087e871039d66b82fcb2cb719f6a541e650e05735c32c1be871ef9ae9a456",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    response: mock<ethers.providers.TransactionResponse>(),
    receipt: mock<ethers.providers.TransactionReceipt>(),
  };

  const bnbTx: EvmTx = {
    ...ethereumTx,
    ecosystemId: EvmEcosystemId.Bnb,
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
