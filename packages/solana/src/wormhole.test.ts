import type { ParsedTransactionWithMeta } from "@solana/web3.js";

import { parseSequenceFromLogSolana } from "./wormhole";

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
});
