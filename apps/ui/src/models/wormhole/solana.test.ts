/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { Env } from "@swim-io/core-types";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

import type { TokenSpec } from "../../config";
import { PROJECTS, TOKENS, TokenProjectId } from "../../config";
import {
  parsedSwimSwapTx,
  parsedWormholePostVaaTxs,
  parsedWormholeRedeemEvmUnlockWrappedTx,
} from "../../fixtures";
import type { SolanaTx } from "../crossEcosystem";

import {
  isLockSplTx,
  isPostVaaSolanaTx,
  isRedeemOnSolanaTx,
  parseSequenceFromLogSolana,
} from "./solana";

describe("models - Wormhole utils", () => {
  const wormholeBridge = "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
  const wormholeTokenBridge = "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";

  describe("parseSequenceFromLogSolana 94176", () => {
    const SOLANA_SEQ_LOG = "Program log: Sequence: 94176";
    it("finds the sequence from a Wormhole tx", () => {
      const tx: ParsedTransactionWithMeta = {
        slot: 1,
        transaction: {
          signatures: ["test"],
          message: { accountKeys: [], instructions: [], recentBlockhash: "" },
        },
        meta: {
          logMessages: [SOLANA_SEQ_LOG],
          fee: 0,
          preBalances: [0],
          postBalances: [0],
          err: "",
        },
      };
      expect(parseSequenceFromLogSolana(tx)).toEqual("94176");
    });
    it("throws error for a tx with no sequence", () => {
      const tx: ParsedTransactionWithMeta = {
        slot: 1,
        transaction: {
          signatures: ["test"],
          message: { accountKeys: [], instructions: [], recentBlockhash: "" },
        },
        meta: {
          logMessages: [],
          fee: 0,
          preBalances: [0],
          postBalances: [0],
          err: "",
        },
      };
      expect(() => parseSequenceFromLogSolana(tx)).toThrowError(
        /sequence not found/i,
      );
    });
  });

  describe("isLockSplTx", () => {
    it("returns true for a tx which locks native SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const splTokenAccountAddress =
        "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const token: TokenSpec = {
        id: "test-token",
        project: PROJECTS[TokenProjectId.Swim],
        nativeEcosystem: SOLANA_ECOSYSTEM_ID,
        detailsByEcosystem: new Map([
          [SOLANA_ECOSYSTEM_ID, { address: "xxx", decimals: 8 }],
          [BNB_ECOSYSTEM_ID, { address: "xxx", decimals: 18 }],
        ]),
      };
      const tx: SolanaTx = {
        interactionId,
        ecosystem: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedSwimSwapTx.blockTime ?? null,
        txId: parsedSwimSwapTx.transaction.signatures[0],
        parsedTx: parsedSwimSwapTx,
      };

      expect(
        isLockSplTx(wormholeTokenBridge, splTokenAccountAddress, token, tx),
      ).toBe(true);
    });
    it.todo("returns true for a tx which burns Wormhole-wrapped SPL tokens");
    it.todo("returns false for txs which post VAAs");
    it.todo("returns false for a tx which unlocks native SPL tokens");
    it.todo("returns false for a tx which mints Wormhole-wrapped SPL tokens");
  });

  describe("isPartiallyDecodedInstruction", () => {
    it.todo("returns true for a partially decoded instruction");
    it.todo("returns false for a parsed instruction");
  });

  describe("isPostVaaSolanaTx", () => {
    it.todo("returns false for a tx which locks native SPL tokens");
    it.todo("returns false for a tx which burns Wormhole-wrapped SPL tokens");

    it.each(parsedWormholePostVaaTxs)(
      "returns true for txs which post VAAs",
      (parsedTx) => {
        const interactionId = "e45794d6c5a2750a589f875c84089f81";
        const signatureSetAddress =
          "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
        const tx: SolanaTx = {
          interactionId,
          ecosystem: SOLANA_ECOSYSTEM_ID,
          timestamp: parsedTx.blockTime!,
          txId: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isPostVaaSolanaTx(
          wormholeBridge,
          signatureSetAddress,
          tx,
        );
        expect(result).toBe(true);
      },
    );

    it.todo("returns false for a tx which unlocks native SPL tokens");

    it("returns false for a tx which mints Wormhole-wrapped SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const signatureSetAddress =
        "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
      const tx: SolanaTx = {
        interactionId,
        ecosystem: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        txId: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isPostVaaSolanaTx(wormholeBridge, signatureSetAddress, tx);
      expect(result).toBe(false);
    });
  });

  describe("isRedeemOnSolanaTx", () => {
    it.todo("returns false for a tx which locks native SPL tokens");
    it.todo("returns false for a tx which burns Wormhole-wrapped SPL tokens");

    it.each(parsedWormholePostVaaTxs)(
      "returns false for txs which post VAAs",
      (parsedTx) => {
        const interactionId = "e45794d6c5a2750a589f875c84089f81";
        const tokenSpec = TOKENS[Env.Mainnet].find(
          (token) => token.id === "mainnet-bnb-busd",
        )!;
        const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
        const tx: SolanaTx = {
          interactionId,
          ecosystem: SOLANA_ECOSYSTEM_ID,
          timestamp: parsedTx.blockTime!,
          txId: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isRedeemOnSolanaTx(
          wormholeTokenBridge,
          tokenSpec,
          splTokenAccount,
          tx,
        );
        expect(result).toBe(false);
      },
    );

    it.todo("returns true for a tx which unlocks native SPL tokens");

    it("returns true for a tx which redeems Wormhole-wrapped SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const tokenSpec = TOKENS[Env.Mainnet].find(
        (token) => token.id === "mainnet-bnb-busd",
      )!;
      const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const tx: SolanaTx = {
        interactionId,
        ecosystem: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        txId: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isRedeemOnSolanaTx(
        wormholeTokenBridge,
        tokenSpec,
        splTokenAccount,
        tx,
      );
      expect(result).toBe(true);
    });
  });
});
