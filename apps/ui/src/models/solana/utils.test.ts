import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import {
  createProgramAddress,
  findProgramAddress,
  getAssociatedTokenAddress,
} from "./utils";

describe("Solana utils", () => {
  const defaultUser = new PublicKey(
    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
  );
  const defaultMint = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  );

  describe("createProgramAddress", () => {
    it("matches Solana web3's asynchronous functionality", async () => {
      const nonce = 3;
      const seeds = [
        defaultUser.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        defaultMint.toBuffer(),
        Buffer.from([nonce]),
      ];
      const result = createProgramAddress(seeds, ASSOCIATED_TOKEN_PROGRAM_ID);
      const expected = await PublicKey.createProgramAddress(
        seeds,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      expect(result.toBase58()).toEqual(expected.toBase58());
    });
  });

  describe("findProgramAddress", () => {
    it("matches Solana web3's asynchronous functionality", async () => {
      const seeds = [
        defaultUser.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        defaultMint.toBuffer(),
      ];
      const result = findProgramAddress(seeds, ASSOCIATED_TOKEN_PROGRAM_ID);
      const expected = await PublicKey.findProgramAddress(
        seeds,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      expect(result[0].toBase58()).toEqual(expected[0].toBase58());
      expect(result[1]).toEqual(expected[1]);
    });
  });

  describe("getAssociatedTokenAddress", () => {
    it("matches Solana web3's asynchronous functionality", async () => {
      const result = getAssociatedTokenAddress(defaultMint, defaultUser);
      const expected = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        defaultMint,
        defaultUser,
      );
      expect(result.toBase58()).toEqual(expected.toBase58());
    });
  });
});
