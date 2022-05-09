/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

import type { ChainsByProtocol } from "../../config";
import { EcosystemId, Env, chains, pools, tokens } from "../../config";
import { parsedSwimSwapTx } from "../../fixtures/solana/txs";
import { Amount } from "../amount";
import type { SolanaTx } from "../crossEcosystem";

import { SwimDefiInstruction } from "./instructions";
import type {
  AddInteraction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
} from "./interaction";
import type {
  Steps,
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
  createSteps,
  createSwapSteps,
  findMissingSplTokenAccountMints,
  getTransferFromTxs,
  getTransferToTxs,
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
const lpTokenId = "localnet-solana-lp-hexapool";
const lpToken = localnetTokens.find((token) => token.id === lpTokenId)!;
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

describe("Swim steps", () => {
  const defaultInteractionId = "2dd7602f7db6617697ecf04ac4aac930";
  const defaultSolanaWalletAddress =
    "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J";
  const splTokenMints = [
    "2WDq7wSs9zYrpx2kbHDA4RUTRch2CCTP6ZWaH4GNfnQQ", // Not in pool
    "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy", // "localnet-solana-usdc"
    "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // "localnet-solana-usdt"
    "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb", // "localnet-ethereum-usdc"
    "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv", // "localnet-ethereum-usdt"
    "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg", // "localnet-bsc-busd"
    "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr", // "localnet-bsc-usdt"
    "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2", // "localnet-solana-lp-hexapool"
  ];
  const defaultTimestamp = 1642762608;
  const solanaTx: SolanaTx = {
    ecosystem: EcosystemId.Solana,
    txId: "34PhSGJi3XboZEhZEirTM6FEh1hNiYHSio1va1nNgH7S9LSNJQGSAiizEyVbgbVJzFjtsbyuJ2WijN53FSC83h7h",
    timestamp: defaultTimestamp,
    interactionId: defaultInteractionId,
    parsedTx: parsedSwimSwapTx,
  };
  const defaultSplTokenAccounts = splTokenMints
    .filter((_, i) => [0, 2, 3].includes(i))
    .map(generateSplTokenAccount);

  let swapInteraction: SwapInteraction;
  let keypair: Keypair;

  beforeEach(() => {
    keypair = Keypair.generate();
    swapInteraction = {
      id: defaultInteractionId,
      env: Env.Mainnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: {
        "localnet-ethereum-usdt": keypair,
      },
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
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // "localnet-solana-usdt"
        "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb", // "localnet-ethereum-usdc"
        "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv", // "localnet-ethereum-usdt"
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
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // "localnet-solana-usdt"
        "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv", // "localnet-ethereum-usdt"
        "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2", // "localnet-solana-lp-hexapool"
      ]);
    });
    it("should throw an error if Solana wallet is not connected", () => {
      const interaction: SwapInteraction = {
        ...swapInteraction,
        connectedWallets: {
          ...swapInteraction.connectedWallets,
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
      ).toThrowError(/Missing Solana wallet/i);
    });
  });

  describe("createAddSteps", () => {
    let interaction: AddInteraction;
    let result: Steps;

    beforeEach(() => {
      interaction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs: { [poolTokens[3].id]: keypair },
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
      result = createAddSteps(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
        txsByStep,
      );
    });

    it("generate steps for add instruction type", () => {
      expect(result["createSplTokenAccounts"].isComplete).toBeFalsy();
      expect(result["wormholeToSolana"].isComplete).toBeFalsy();
    });
    it("have found mint tokens", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultSplTokenAccounts,
        poolTokens,
        lpToken,
        interaction,
      );
      expect(result.createSplTokenAccounts.mints).toEqual(mints);
    });
    it("have generated transfer tokens", () => {
      const inputTransfersRes = generateInputTransfers(
        interaction.id,
        defaultSplTokenAccounts,
        poolTokens,
        interaction.params.inputAmounts,
        interaction.signatureSetKeypairs,
      );
      expect(result.wormholeToSolana.transfers.tokens).toEqual(
        inputTransfersRes,
      );
    });
    it("have LPToken tranfer type", () => {
      expect(result["wormholeFromSolana"].transfers.type).toEqual(
        TransferType.LpToken,
      );
    });
    it("generate lpToken", () => {
      const resLpOutProtoTransfer = generateLpOutProtoTransfer(
        interaction.id,
        lpToken,
        interaction.lpTokenTargetEcosystem,
      );

      expect(result.wormholeFromSolana.transfers.lpToken).toEqual(
        resLpOutProtoTransfer,
      );
    });
  });

  describe("createSwapSteps", () => {
    it("generate steps for swap interaction type", () => {
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
      expect(result.createSplTokenAccounts.mints).toEqual(mints);
      expect(result.createSplTokenAccounts.isComplete).toBeFalsy();
      expect(result.wormholeToSolana.isComplete).toBeFalsy();
      expect(result.wormholeToSolana.transfers.tokens).toEqual(
        inputTransfersRes,
      );
      expect(result.wormholeFromSolana.transfers.tokens).toEqual(
        resSingleOutputT,
      );
      expect(result.wormholeFromSolana.knownAmounts).toBe(false);
      expect(result.interactWithPool.isComplete).toBe(false);
    });
  });

  describe("createRemoveUniformSteps", () => {
    const interaction: RemoveUniformInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { "localnet-ethereum-usdt": keypair },
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

      expect(result.createSplTokenAccounts.mints).toEqual(mints);
    });
  });

  describe("createRemoveExactBurnSteps", () => {
    const interaction: RemoveExactBurnInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: "test-pool",
      submittedAt: 1646408146771,
      signatureSetKeypairs: { [poolTokens[3].id]: keypair },
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

      expect(result.createSplTokenAccounts.mints).toEqual(mints);
      expect(result.wormholeToSolana.transfers.lpToken).toEqual(
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
        signatureSetKeypairs: { [poolTokens[3].id]: keypair },
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
  describe("createSteps", () => {
    const chainsConfig: ChainsByProtocol = chains[Env.Localnet];
    const poolContractAddress: string = pools[Env.Localnet][0].contract;
    const amounts = ["0", "1.111", "0", "3333.3", "2", "0"].map((amount, i) =>
      Amount.fromHumanString(poolTokens[i], amount),
    );

    const signatureSetKeypairs = poolTokens.reduce(
      (accumulator, token, i) => ({
        ...accumulator,
        [token.id]: Keypair.generate(),
      }),
      {},
    );
    const wormholeToSolanaTxs = getTransferToTxs(
      chainsConfig,
      defaultSolanaWalletAddress,
      defaultSplTokenAccounts,
      poolTokens,
      lpToken,
      {},
      [solanaTx],
    );
    const wormholeFromSolanaTxs = getTransferFromTxs(
      chainsConfig,
      defaultSolanaWalletAddress,
      defaultSplTokenAccounts,
      poolTokens,
      lpToken,
      [solanaTx],
    );

    const txByStep: TxsByStep = {
      [StepType.CreateSplTokenAccounts]: [],
      [StepType.WormholeToSolana]: wormholeToSolanaTxs,
      [StepType.SolanaPoolInteraction]: [],
      [StepType.WormholeFromSolana]: wormholeFromSolanaTxs,
    };

    describe("createSteps - createAddSteps", () => {
      let addInteraction: AddInteraction;
      beforeEach(() => {
        addInteraction = {
          id: defaultInteractionId,
          env: Env.Localnet,
          poolId: "test-pool",
          submittedAt: 1646408146771,
          signatureSetKeypairs: {},
          previousSignatureSetAddresses: {},
          connectedWallets: {
            [EcosystemId.Solana]: null,
            [EcosystemId.Ethereum]: null,
            [EcosystemId.Bsc]: null,
            [EcosystemId.Terra]: null,
            [EcosystemId.Polygon]: null,
            [EcosystemId.Avalanche]: null,
          },
          instruction: SwimDefiInstruction.Add,
          lpTokenTargetEcosystem: EcosystemId.Bsc,
          params: {
            inputAmounts: amounts,
            minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
          },
        };
      });

      it("throws an error if wallet address is missing", () => {
        const getResult = () =>
          createSteps(
            chainsConfig,
            poolContractAddress,
            defaultSplTokenAccounts,
            poolTokens,
            lpToken,
            addInteraction,
            [solanaTx],
          );
        expect(getResult).toThrowError(/Missing Solana wallet/i);
      });
      it("throws an error, if there is no signature set keypair", () => {
        const interactionWithWallet: AddInteraction = {
          ...addInteraction,
          connectedWallets: {
            ...addInteraction.connectedWallets,
            [EcosystemId.Solana]: defaultSolanaWalletAddress,
          },
        };
        const getResult = () =>
          createSteps(
            chainsConfig,
            poolContractAddress,
            defaultSplTokenAccounts,
            poolTokens,
            lpToken,
            interactionWithWallet,
            [solanaTx],
          );
        expect(getResult).toThrowError(/Missing signature set key pair/i);
      });
      it("returns Add steps interaction", () => {
        const interactionWithWallet: AddInteraction = {
          ...addInteraction,
          signatureSetKeypairs,
          connectedWallets: {
            ...addInteraction.connectedWallets,
            [EcosystemId.Solana]: defaultSolanaWalletAddress,
          },
        };

        const expected = createAddSteps(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          interactionWithWallet,
          txByStep,
        );
        const result = createSteps(
          chainsConfig,
          poolContractAddress,
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          interactionWithWallet,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("createSteps - createSwapSteps", () => {
      const swapInteraction2: SwapInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs,
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
          exactInputAmounts: amounts,
          outputTokenIndex: 2,
          minimumOutputAmount: Amount.fromHumanString(poolTokens[2], "3000"),
        },
      };
      it("returns result of createSwapSteps", () => {
        const result = createSwapSteps(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          swapInteraction2,
          txByStep,
        );
        const expected = createSteps(
          chainsConfig,
          poolContractAddress,
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          swapInteraction2,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("createSteps - createRemoveUniformSteps", () => {
      const removeUniformInteraction: RemoveUniformInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs,
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
      it("returns result of createRemoveUniformSteps", () => {
        const result = createRemoveUniformSteps(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeUniformInteraction,
          txByStep,
        );
        const expected = createSteps(
          chainsConfig,
          poolContractAddress,
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeUniformInteraction,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("createSteps - createRemoveExactBurnSteps", () => {
      const removeExactBurnInteraction: RemoveExactBurnInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs,
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
      it("returns result of createRemoveExactBurnSteps", () => {
        const result = createRemoveExactBurnSteps(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeExactBurnInteraction,
          txByStep,
        );
        const expected = createSteps(
          chainsConfig,
          poolContractAddress,
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeExactBurnInteraction,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("createSteps - createRemoveExactOutputSteps", () => {
      const removeExactOutputInteraction: RemoveExactOutputInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: "test-pool",
        submittedAt: 1646408146771,
        signatureSetKeypairs: { [poolTokens[3].id]: keypair },
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
      it("returns result of createRemoveExactOutputSteps", () => {
        const result = createRemoveExactOutputSteps(
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeExactOutputInteraction,
          txByStep,
        );
        const expected = createSteps(
          chainsConfig,
          poolContractAddress,
          defaultSplTokenAccounts,
          poolTokens,
          lpToken,
          removeExactOutputInteraction,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
  });
});
