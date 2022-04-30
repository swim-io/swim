/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import { EcosystemId, Env, tokens } from "../../config";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type { AddInteraction, SwapInteraction } from "./interaction";
import type {
  WormholeFromSolanaFullStep,
  WormholeFromSolanaProtoStep,
} from "./steps";
import {
  StepType,
  findMissingSplTokenAccountMints,
  isWormholeFromSolanaFullStep,
} from "./steps";
import { TransferType } from "./transfer";

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
const lpTokenId = "localnet-solana-lp-hexapool";
const lpToken = localnetTokens.find((token) => token.id === lpTokenId)!;

const generateSplTokenAccount = (mint: string): TokenAccountInfo => ({
  address: PublicKey.default,
  mint: new PublicKey(mint),
  owner: PublicKey.default,
  amount: new u64(123),
  delegate: null,
  delegatedAmount: new u64(0),
  isInitialized: true,
  isFrozen: false,
  isNative: true,
  rentExemptReserve: null,
  closeAuthority: null,
});

describe("Swim steps", () => {
  const defaultInteractionId = "2dd7602f7db6617697ecf04ac4aac930";
  const defaultSolanaWalletAddress =
    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J";
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

  describe("isWormholeFromSolanaFullStep", () => {
    it("returns true for a full step", () => {
      const fullStep: WormholeFromSolanaFullStep = {
        type: StepType.WormholeFromSolana,
        isComplete: false,
        knownAmounts: true,
        transfers: {
          type: TransferType.LpToken,
          lpToken: null,
        },
        txs: {},
      };
      expect(isWormholeFromSolanaFullStep(fullStep)).toBe(true);
    });

    it("returns false for a proto step", () => {
      const protoStep: WormholeFromSolanaProtoStep = {
        type: StepType.WormholeFromSolana,
        isComplete: false,
        knownAmounts: false,
        transfers: {
          type: TransferType.LpToken,
          lpToken: null,
        },
        txs: {},
      };
      expect(isWormholeFromSolanaFullStep(protoStep)).toBe(false);
    });
  });

  describe("findMissingSplTokenAccountMints", () => {
    it("finds missing SPL token account mints if LP token is not involved", () => {
      const interaction: SwapInteraction = {
        id: defaultInteractionId,
        env: Env.Mainnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs: {},
        previousSignatureSetAddresses: {},
        connectedWallets: {
          [EcosystemId.Solana]: defaultSolanaWalletAddress,
          [EcosystemId.Ethereum]: null,
          [EcosystemId.Bsc]: null,
          [EcosystemId.Terra]: null,
          [EcosystemId.Polygon]: null,
          [EcosystemId.Avalanche]: null,
        },
        instruction: SwimDefiInstruction.Swap,
        params: {
          exactInputAmounts: defaultAmounts,
          outputTokenIndex: 2,
          minimumOutputAmount: Amount.fromHumanString(poolTokens[2], "3000"),
        },
      };
      const result = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );

      expect(result).toEqual([
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
        "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
        "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
      ]);
    });

    it("finds missing SPL token account mints if LP token is involved", () => {
      const interaction: AddInteraction = {
        id: defaultInteractionId,
        env: Env.Mainnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs: {},
        previousSignatureSetAddresses: {},
        connectedWallets: {
          [EcosystemId.Solana]: defaultSolanaWalletAddress,
          [EcosystemId.Ethereum]: null,
          [EcosystemId.Bsc]: null,
          [EcosystemId.Terra]: null,
          [EcosystemId.Polygon]: null,
          [EcosystemId.Avalanche]: null,
        },
        instruction: SwimDefiInstruction.Add,
        lpTokenTargetEcosystem: EcosystemId.Bsc,
        params: {
          inputAmounts: defaultAmounts,
          minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
        },
      };
      const result = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );

      expect(result).toEqual([
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
        "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
        "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
      ]);
    });
  });
});
