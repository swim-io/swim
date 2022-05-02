/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PublicKey } from "@solana/web3.js";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";

import type { TokenSpec, WormholeChainSpec } from "../../config";
import { EcosystemId, Env, Protocol, chains, tokens } from "../../config";
import {
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
  describe("parseSequenceFromLogSolana", () => {
    const SOLANA_SEQ_LOG = "Program log: Sequence: ";
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
      expect(parseSequenceFromLogSolana(tx)).toEqual("");
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
      expect(() => parseSequenceFromLogSolana(tx)).toThrow();
    });
  });

  describe("isLockSplTx", () => {
    it("returns true for a tx which locks native SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const tokenBridge = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const wormholeChainId: WormholeChainSpec = {
        bridge: "bridge",
        tokenBridge: tokenBridge,
      };
      const spiTokenAccountAddres =
        "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const token: TokenSpec = {
        id: "test-token",
        symbol: "TEST",
        displayName: "Test Token",
        icon: ":)",
        isStablecoin: false,
        nativeEcosystem: EcosystemId.Solana,
        detailsByEcosystem: new Map([
          [EcosystemId.Solana, { address: "xxx", decimals: 8 }],
          [EcosystemId.Bsc, { address: "xxx", decimals: 18 }],
        ]),
      };
      const parsedTx = {
        blockTime: 123456,
        transaction: {
          signatures: ["2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp"],
          message: {
            accountKeys: [],
            instructions: [
              {
                programId: new PublicKey(tokenBridge),
                accounts: [],
                data: "data",
              },
            ],
            recentBlockhash: "4T4Pnrtr1A15QRx69DukxvABoU2RiGmGeNAwaqiiAxyp",
          },
        },
        slot: 1,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [
            {
              index: 0,
              instructions: [
                {
                  parsed: {
                    info: {
                      authority: "tgeGxWBSAjtpgx4Hoyr2jgt1kdusYzHTPn9YivXTVZ6",
                      destination:
                        "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
                      source: "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e",
                      amount: "1000",
                    },
                    type: "transfer",
                  },
                  program: "spl-token",
                  programId: new PublicKey(tokenBridge),
                },
              ],
            },
          ],
          postBalances: [422390371],
          preBalances: [424873131],
        },
      };
      const tx: SolanaTx = {
        interactionId,
        ecosystem: EcosystemId.Solana,
        timestamp: parsedTx.blockTime,
        txId: parsedTx.transaction.signatures[0],
        parsedTx,
      };

      expect(
        isLockSplTx(wormholeChainId, spiTokenAccountAddres, token, tx),
      ).toBeTruthy();
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
        const wormholeChainSpec =
          chains[Env.Mainnet][Protocol.Solana][0].wormhole;
        const signatureSetAddress =
          "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
        const tx: SolanaTx = {
          interactionId,
          ecosystem: EcosystemId.Solana,
          timestamp: parsedTx.blockTime!,
          txId: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isPostVaaSolanaTx(
          wormholeChainSpec,
          signatureSetAddress,
          tx,
        );
        expect(result).toBe(true);
      },
    );

    it.todo("returns false for a tx which unlocks native SPL tokens");

    it("returns false for a tx which mints Wormhole-wrapped SPL tokens", () => {
      const interactionId = "e45794d6c5a2750a589f875c84089f81";
      const wormholeChainSpec =
        chains[Env.Mainnet][Protocol.Solana][0].wormhole;
      const signatureSetAddress =
        "2XjLRw6BTVTTL5hLDdKyLtPL6toGM7HkKJivGjtZBotp";
      const tx: SolanaTx = {
        interactionId,
        ecosystem: EcosystemId.Solana,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        txId: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isPostVaaSolanaTx(
        wormholeChainSpec,
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
        const wormholeChainSpec =
          chains[Env.Mainnet][Protocol.Solana][0].wormhole;
        const tokenSpec = tokens[Env.Mainnet].find(
          (token) => token.id === "mainnet-bsc-busd",
        )!;
        const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
        const tx: SolanaTx = {
          interactionId,
          ecosystem: EcosystemId.Solana,
          timestamp: parsedTx.blockTime!,
          txId: parsedTx.transaction.signatures[0],
          parsedTx,
        };

        const result = isRedeemOnSolanaTx(
          wormholeChainSpec,
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
      const wormholeChainSpec =
        chains[Env.Mainnet][Protocol.Solana][0].wormhole;
      const tokenSpec = tokens[Env.Mainnet].find(
        (token) => token.id === "mainnet-bsc-busd",
      )!;
      const splTokenAccount = "Ex4QfU1vD5dtFQYHJrs6XwLaRzy2C5yZKhQSNJJXQg5e";
      const tx: SolanaTx = {
        interactionId,
        ecosystem: EcosystemId.Solana,
        timestamp: parsedWormholeRedeemEvmUnlockWrappedTx.blockTime!,
        txId: parsedWormholeRedeemEvmUnlockWrappedTx.transaction.signatures[0],
        parsedTx: parsedWormholeRedeemEvmUnlockWrappedTx,
      };

      const result = isRedeemOnSolanaTx(
        wormholeChainSpec,
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
