/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

import { EcosystemId, Env, tokens } from "../../config";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type {
  AddInteraction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
} from "./interaction";
import type {
  TxsByStep,
  WormholeFromSolanaFullStep,
  WormholeFromSolanaProtoStep,
} from "./steps";
import {
  StepType,
  createAddSteps,
  createRemoveExactBurnSteps,
  createRemoveExactOutputSteps,
  createRemoveUniformSteps,
  createSwapSteps,
  findMissingSplTokenAccountMints,
  isWormholeFromSolanaFullStep,
} from "./steps";
import {
  TransferType,
  generateInputTransfers,
  generateLpInTransfer,
  generateLpOutProtoTransfer,
  generateOutputTransfers,
  generateSingleOutputProtoTransfers,
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
const lpTokenId = "localnet-solana-lp-hexapool";
const lpToken = localnetTokens.find((token) => token.id === lpTokenId)!;
const txsByStep: TxsByStep = {
  [StepType.CreateSplTokenAccounts]: [],
  [StepType.WormholeToSolana]: {},
  [StepType.SolanaPoolInteraction]: [],
  [StepType.WormholeFromSolana]: {},
};

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
const defaultAmounts = ["0", "1.111", "0", "3333.3", "0", "0"].map(
  (amount, i) => Amount.fromHumanString(poolTokens[i], amount),
);
// const exactInputAmounts = poolTokens.map((poolToken) => Amount.zero(poolToken));

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

  const keyPair = new Keypair();
  let swapInteraction: SwapInteraction;

  beforeEach(() => {
    swapInteraction = {
      id: defaultInteractionId,
      env: Env.Mainnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { [poolTokens[3].id]: keyPair },
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
  });

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
      const result = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        swapInteraction,
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
    it("should throw an error if Solana wallet is not connected", () => {
      const interaction: SwapInteraction = {
        ...swapInteraction,
        connectedWallets: {
          [EcosystemId.Solana]: null,
        },
      };
      expect(() =>
        findMissingSplTokenAccountMints(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          interaction,
        ),
      ).toThrow();
    });
    it("should throw an error if interaction type is not supported", () => {
      const interaction = {};
      expect(() =>
        findMissingSplTokenAccountMints(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          interaction,
        ),
      ).toThrow();
    });
  });

  describe("createAddSteps", () => {
    const interaction: AddInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { [poolTokens[3].id]: keyPair },
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
    const result = createAddSteps(
      defaultSplTokenAccounts,
      poolTokens,
      lpToken,
      interaction,
      txsByStep,
    );
    it("should generate steps for add instruction type", () => {
      expect(Object.keys(result)).toEqual([
        "createSplTokenAccounts",
        "wormholeToSolana",
        "interactWithPool",
        "wormholeFromSolana",
      ]);
      expect(result["createSplTokenAccounts"].isComplete).toBeFalsy();
      expect(result["wormholeToSolana"].isComplete).toBeFalsy();
    });
    it("should have found mint tokens", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );
      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
    });
    it("should have generated transfer tokens", () => {
      const inputTransfersRes = generateInputTransfers(
        interaction.id,
        defaultSplTokenAccounts,
        poolTokens,
        interaction.params.inputAmounts,
        interaction.signatureSetKeypairs,
      );
      expect(result["wormholeToSolana"].transfers.tokens).toEqual(
        inputTransfersRes,
      );
    });
    it("should thave LPToken tranfer type", () => {
      expect(result["wormholeFromSolana"].transfers.type).toEqual(
        TransferType.LpToken,
      );
    });
    it("should generate lpToken", () => {
      const resLpOutProtoTransfer = generateLpOutProtoTransfer(
        interaction.id,
        lpToken,
        interaction.lpTokenTargetEcosystem,
      );

      expect(result["wormholeFromSolana"].transfers.lpToken).toEqual(
        resLpOutProtoTransfer,
      );
    });
  });

  describe("createSwapSteps", () => {
    it("should generate steps for swap interaction type", () => {
      const result = createSwapSteps(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        swapInteraction,
        txsByStep,
      );
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        swapInteraction,
      );

      const inputTransfersRes = generateInputTransfers(
        swapInteraction.id,
        defaultSplTokenAccounts,
        poolTokens,
        swapInteraction.params.exactInputAmounts,
        swapInteraction.signatureSetKeypairs,
      );
      const resSingleOutputT = generateSingleOutputProtoTransfers(
        swapInteraction.id,
        poolTokens,
        swapInteraction.params.outputTokenIndex,
      );

      expect(Object.keys(result)).toEqual([
        "createSplTokenAccounts",
        "wormholeToSolana",
        "interactWithPool",
        "wormholeFromSolana",
      ]);
      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
      expect(result["createSplTokenAccounts"].isComplete).toBeFalsy();
      expect(result["wormholeToSolana"].isComplete).toBeFalsy();
      expect(result["wormholeToSolana"].transfers.tokens).toEqual(
        inputTransfersRes,
      );
      expect(result["wormholeFromSolana"].transfers.tokens).toEqual(
        resSingleOutputT,
      );
    });
  });

  describe("createRemoveUniformSteps", () => {
    const interaction: RemoveUniformInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { [poolTokens[3].id]: keyPair },
      previousSignatureSetAddresses: {},
      connectedWallets: {
        [EcosystemId.Solana]: defaultSolanaWalletAddress,
        [EcosystemId.Ethereum]: null,
        [EcosystemId.Bsc]: null,
        [EcosystemId.Terra]: null,
        [EcosystemId.Polygon]: null,
        [EcosystemId.Avalanche]: null,
      },
      lpTokenSourceEcosystem: EcosystemId.Solana,
      instruction: SwimDefiInstruction.RemoveUniform,
      params: {
        exactBurnAmount: Amount.fromHuman(lpToken, new Decimal(20)),
        minimumOutputAmounts: [],
      },
    };
    const result = createRemoveUniformSteps(
      defaultSplTokenAccounts,
      poolTokens,
      lpToken,
      interaction,
      txsByStep,
    );
    it("should generate steps for RemoveUniform interaction type", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );

      expect(Object.keys(result)).toEqual([
        "createSplTokenAccounts",
        "wormholeToSolana",
        "interactWithPool",
        "wormholeFromSolana",
      ]);
      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
    });
  });

  describe("createRemoveExactBurnSteps", () => {
    const interaction: RemoveExactBurnInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { [poolTokens[3].id]: keyPair },
      previousSignatureSetAddresses: {},
      connectedWallets: {
        [EcosystemId.Solana]: defaultSolanaWalletAddress,
        [EcosystemId.Ethereum]: null,
        [EcosystemId.Bsc]: null,
        [EcosystemId.Terra]: null,
        [EcosystemId.Polygon]: null,
        [EcosystemId.Avalanche]: null,
      },
      lpTokenSourceEcosystem: EcosystemId.Solana,
      instruction: SwimDefiInstruction.RemoveExactBurn,
      params: {
        exactBurnAmount: Amount.zero(lpToken),
        outputTokenIndex: 0,
        minimumOutputAmount: Amount.zero(lpToken),
      },
    };
    const result = createRemoveExactBurnSteps(
      defaultSplTokenAccounts,
      poolTokens,
      lpToken,
      interaction,
      txsByStep,
    );
    it("should generate steps for RemoveExactBurn interaction type", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );
      const resLpInTransfer = generateLpInTransfer(
        interaction.id,
        lpToken,
        interaction.params.exactBurnAmount,
        interaction.lpTokenSourceEcosystem,
        interaction.signatureSetKeypairs,
      );

      expect(Object.keys(result)).toEqual([
        "createSplTokenAccounts",
        "wormholeToSolana",
        "interactWithPool",
        "wormholeFromSolana",
      ]);
      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
      expect(result["wormholeToSolana"].transfers.lpToken).toEqual(
        resLpInTransfer,
      );
    });
  });
  describe("createRemoveExactOutputSteps", () => {
    it("should generate steps for removeExactOutput interaction type", () => {
      const interaction: RemoveExactOutputInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs: { [poolTokens[3].id]: keyPair },
        previousSignatureSetAddresses: {},
        connectedWallets: {
          [EcosystemId.Solana]: defaultSolanaWalletAddress,
          [EcosystemId.Ethereum]: null,
          [EcosystemId.Bsc]: null,
          [EcosystemId.Terra]: null,
          [EcosystemId.Polygon]: null,
          [EcosystemId.Avalanche]: null,
        },
        lpTokenSourceEcosystem: EcosystemId.Solana,
        instruction: SwimDefiInstruction.RemoveExactOutput,
        params: {
          maximumBurnAmount: Amount.fromHuman(lpToken, new Decimal(100)),
          exactOutputAmounts: [],
        },
      };
      const result = createRemoveExactOutputSteps(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
        txsByStep,
      );
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );

      const resGenerateLpInTransfer = generateLpInTransfer(
        interaction.id,
        lpToken,
        interaction.params.maximumBurnAmount,
        interaction.lpTokenSourceEcosystem,
        interaction.signatureSetKeypairs,
      );

      const resOutputTransfer = generateOutputTransfers(
        interaction.id,
        defaultSplTokenAccounts,
        poolTokens,
        interaction.params.exactOutputAmounts,
      );

      expect(Object.keys(result)).toEqual([
        "createSplTokenAccounts",
        "wormholeToSolana",
        "interactWithPool",
        "wormholeFromSolana",
      ]);
      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
      expect(result["wormholeToSolana"].transfers.lpToken).toEqual(
        resGenerateLpInTransfer,
      );
      expect(result["wormholeFromSolana"].knownAmounts).toBeTruthy();
      expect(result["wormholeFromSolana"].transfers.tokens).toEqual(
        resOutputTransfer,
      );
    });
  });
});
