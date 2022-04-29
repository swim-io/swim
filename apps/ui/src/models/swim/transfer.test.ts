/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";

import { EcosystemId, Env, tokens } from "../../config";
import { Amount } from "../amount";
import { findAssociatedTokenAccountAddress } from "../solana";

import type { ProtoTransfer, Transfer, Transfers } from "./transfer";
import {
  TransferType,
  combineTransfers,
  generateInputTransfers,
  generateOutputProtoTransfers,
} from "./transfer";

const localnetTokens = tokens[Env.Localnet];
const poolTokens = localnetTokens.filter((token) =>
  [
    "localnet-solana-usdc",
    "localnet-solana-usdt",
    "localnet-ethereum-usdc",
    "localnet-ethereum-usdt",
    "localnet-bsc-busd",
    "localnet-bsc-usdt",
  ].includes(token.id),
);

const generateSplTokenAccount = (mint: string): TokenAccountInfo => {
  const owner = "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J";
  const address = findAssociatedTokenAccountAddress(mint, owner);
  return {
    address: new PublicKey(address),
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount: new u64(123),
    delegate: null,
    delegatedAmount: new u64(0),
    isInitialized: true,
    isFrozen: false,
    isNative: true,
    rentExemptReserve: null,
    closeAuthority: null,
  };
};

describe("Swim transfer", () => {
  const defaultInteractionId = "2dd7602f7db6617697ecf04ac4aac930";
  const defaultToken = localnetTokens.find(
    (token) => token.id === "localnet-ethereum-usdt",
  )!;
  const splTokenMints = [
    "2WDq7wSs9zYrpx2kbHDA4RUTRch2CCTP6ZWaH4GNfnQQ", // Not in pool
    "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy", // Pool token
    "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // Pool token
    "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb", // Pool token
    "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv", // Pool token
    "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg", // Pool token
    "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr", // Pool token
    "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2", // LP token
  ];
  const defaultSplTokenAccounts = splTokenMints
    .filter((_, i) => [0, 2, 3].includes(i))
    .map(generateSplTokenAccount);
  const defaultAmounts = ["0", "1.111", "0", "3333.3", "0", "0"].map(
    (amount, i) => Amount.fromHumanString(poolTokens[i], amount),
  );
  const defaultSignatureSetKeypairs = {
    "localnet-ethereum-usdt": Keypair.generate(),
  };

  describe("combineTransfers", () => {
    const transfer: Transfer = {
      interactionId: defaultInteractionId,
      isComplete: false,
      token: defaultToken,
      fromEcosystem: EcosystemId.Solana,
      toEcosystem: EcosystemId.Ethereum,
      amount: Amount.fromHumanString(defaultToken, "1.23"),
    };
    const protoTransfer: ProtoTransfer = {
      ...transfer,
      amount: null,
    };
    it("handles a cross-chain LP token transfer", () => {
      const transfers: Transfers<Transfer> = {
        type: TransferType.LpToken,
        lpToken: transfer,
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(1);
      expect(result[0].token.id).toBe(defaultToken.id);
    });

    it("handles an empty cross-chain LP token transfer", () => {
      const transfers: Transfers<Transfer> = {
        type: TransferType.LpToken,
        lpToken: null,
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(0);
    });

    it("handles cross-chain pool token transfers", () => {
      const transfers: Transfers<Transfer> = {
        type: TransferType.Tokens,
        tokens: [null, transfer, null, null],
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(1);
      expect(result[0].token.id).toBe(defaultToken.id);
    });

    it("handles a proto cross-chain LP token transfer", () => {
      const transfers: Transfers<ProtoTransfer> = {
        type: TransferType.LpToken,
        lpToken: protoTransfer,
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(1);
      expect(result[0].token.id).toBe(defaultToken.id);
    });

    it("handles an empty proto cross-chain LP token transfer", () => {
      const transfers: Transfers<ProtoTransfer> = {
        type: TransferType.LpToken,
        lpToken: null,
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(0);
    });

    it("handles proto cross-chain pool token transfers", () => {
      const transfers: Transfers<ProtoTransfer> = {
        type: TransferType.Tokens,
        tokens: [null, protoTransfer, null, null],
      };
      const result = combineTransfers(transfers);
      expect(result.length).toBe(1);
      expect(result[0].token.id).toBe(defaultToken.id);
    });
  });

  describe("generateInputTransfers", () => {
    it("generates input transfers", () => {
      const result = generateInputTransfers(
        defaultInteractionId,
        defaultSplTokenAccounts,
        poolTokens,
        defaultAmounts,
        defaultSignatureSetKeypairs,
      );
      expect(result).toEqual([
        null,
        null,
        null,
        {
          interactionId: defaultInteractionId,
          token: defaultToken,
          splTokenAccountAddress: null,
          fromEcosystem: EcosystemId.Ethereum,
          toEcosystem: EcosystemId.Solana,
          amount: Amount.fromHumanString(defaultToken, "3333.3"),
          isComplete: false,
          signatureSetKeypair:
            defaultSignatureSetKeypairs["localnet-ethereum-usdt"],
        },
        null,
        null,
      ]);
    });
  });

  describe("generateOutputProtoTransfers", () => {
    it("generates output proto transfers", () => {
      const result = generateOutputProtoTransfers(
        defaultInteractionId,
        defaultSplTokenAccounts,
        poolTokens,
      );
      expect(result).toEqual([
        null,
        null,
        {
          interactionId: defaultInteractionId,
          token: poolTokens[2],
          splTokenAccountAddress: defaultSplTokenAccounts[2].address.toBase58(),
          fromEcosystem: EcosystemId.Solana,
          toEcosystem: EcosystemId.Ethereum,
          amount: null,
          isComplete: false,
        },
        {
          interactionId: defaultInteractionId,
          token: poolTokens[3],
          splTokenAccountAddress: null,
          fromEcosystem: EcosystemId.Solana,
          toEcosystem: EcosystemId.Ethereum,
          amount: null,
          isComplete: false,
        },
        {
          interactionId: defaultInteractionId,
          token: poolTokens[4],
          splTokenAccountAddress: null,
          fromEcosystem: EcosystemId.Solana,
          toEcosystem: EcosystemId.Bsc,
          amount: null,
          isComplete: false,
        },
        {
          interactionId: defaultInteractionId,
          token: poolTokens[5],
          splTokenAccountAddress: null,
          fromEcosystem: EcosystemId.Solana,
          toEcosystem: EcosystemId.Bsc,
          amount: null,
          isComplete: false,
        },
      ]);
    });
  });
});
