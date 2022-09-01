/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId } from "@swim-io/token-projects";

import type { TokenSpec } from "../../config";
import { CHAINS, Protocol, TOKENS } from "../../config";
import {
  parsedSwimSwapTx,
  parsedWormholePostVaaTxs,
  parsedWormholeRedeemEvmUnlockWrappedTx,
} from "../../fixtures";

import {
  isLockSplTx,
  isPostVaaSolanaTx,
  isRedeemOnSolanaTx,
  parseSequenceFromLogSolana,
} from "./solana";

describe("models - Wormhole utils", () => {
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
      const portal = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const wormholeChainId: WormholeChainConfig = {
        bridge: "bridge",
        portal,
      };
      const splTokenAccountAddress =
        "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const token: TokenSpec = {
        id: "test-token",
        projectId: TokenProjectId.Swim,
        nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
        nativeDetails: { address: "xxx", decimals: 8 },
        wrappedDetails: new Map([
          [EvmEcosystemId.Bnb, { address: "xxx", decimals: 18 }],
        ]),
      };
      const tx: SolanaTx = {
        interactionId,
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedSwimSwapTx.blockTime ?? null,
        id: parsedSwimSwapTx.transaction.signatures[0],
        parsedTx: parsedSwimSwapTx,
      };

      expect(
        isLockSplTx(wormholeChainId, splTokenAccountAddress, token, tx),
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
        const wormholeChainConfig =
          CHAINS[Env.Mainnet][Protocol.Solana][0].wormhole;
        const signatureSetAddress =
          "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
        const tx: SolanaTx = {
          interactionId,
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          timestamp: parsedTx.blockTime!,
          id: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isPostVaaSolanaTx(
          wormholeChainConfig,
          signatureSetAddress,
          tx,
        );
        expect(result).toBe(true);
      },
    );

    it.todo("returns false for a tx which unlocks native SPL tokens");

    it("returns false for a tx which mints Wormhole-wrapped SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const wormholeChainConfig =
        CHAINS[Env.Mainnet][Protocol.Solana][0].wormhole;
      const signatureSetAddress =
        "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
      const tx: SolanaTx = {
        interactionId,
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        id: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isPostVaaSolanaTx(
        wormholeChainConfig,
        signatureSetAddress,
        tx,
      );
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
        const wormholeChainConfig =
          CHAINS[Env.Mainnet][Protocol.Solana][0].wormhole;
        const tokenSpec = TOKENS[Env.Mainnet].find(
          (token) => token.id === "mainnet-bnb-busd",
        )!;
        const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
        const tx: SolanaTx = {
          interactionId,
          ecosystemId: SOLANA_ECOSYSTEM_ID,
          timestamp: parsedTx.blockTime!,
          id: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isRedeemOnSolanaTx(
          wormholeChainConfig,
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
      const wormholeChainConfig =
        CHAINS[Env.Mainnet][Protocol.Solana][0].wormhole;
      const tokenSpec = TOKENS[Env.Mainnet].find(
        (token) => token.id === "mainnet-bnb-busd",
      )!;
      const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const tx: SolanaTx = {
        interactionId,
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        id: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isRedeemOnSolanaTx(
        wormholeChainConfig,
        tokenSpec,
        splTokenAccount,
        tx,
      );
      expect(result).toBe(true);
    });
  });

  describe("isUnlockSplTx", () => {
    it.todo("returns false for a tx which locks native SPL tokens");
    it.todo("returns false for a tx which burns Wormhole-wrapped SPL tokens");
    it.todo("returns true for txs which post VAAs");
    it.todo("returns true for a tx which unlocks native SPL tokens");
    it.todo("returns true for a tx which mints Wormhole-wrapped SPL tokens");
  });
});
