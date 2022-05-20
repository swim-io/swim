/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

import type { ChainsByProtocol } from "../../config";
import { EcosystemId, Env, chains, configs, pools, tokens } from "../../config";
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
import { InteractionType } from "./interaction";
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
  [StepType.SolanaOperations]: {},
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
  const defaultPoolId = "hexapool";
  const defaultTokensByPoolId = {
    [defaultPoolId]: {
      tokens: poolTokens,
      lpToken,
    },
  };
  const defaultPoolSpecs = [pools[Env.Localnet][0]];

  let swapInteraction: SwapInteraction;
  let keypair: Keypair;

  beforeEach(() => {
    keypair = Keypair.generate();
    swapInteraction = {
      id: defaultInteractionId,
      env: Env.Mainnet,
      poolIds: [defaultPoolId],
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
        [EcosystemId.Aurora]: null,
        [EcosystemId.Fantom]: null,
        [EcosystemId.Acala]: null,
      },
      type: InteractionType.Swap,
      params: {
        exactInputAmount: Amount.fromHumanString(poolTokens[1], "3000"),
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
        defaultTokensByPoolId,
        defaultPoolSpecs,
        swapInteraction,
        defaultSplTokenAccounts,
      );

      expect(result.length).toBe(2);
      [
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // "localnet-solana-usdt"
        "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb", // "localnet-ethereum-usdc"
      ].forEach((mint) => expect(result).toContain(mint));
    });

    it("finds missing SPL token account mints if LP token is involved", () => {
      const interaction: AddInteraction = {
        id: defaultInteractionId,
        env: Env.Mainnet,
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        type: InteractionType.Add,
        lpTokenTargetEcosystem: EcosystemId.Bsc,
        params: {
          inputAmounts: new Map(
            defaultAmounts.map((amount) => [amount.tokenId, amount]),
          ),
          minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
        },
      };
      const result = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        defaultSplTokenAccounts,
      );

      expect(result).toEqual([
        "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23", // "localnet-solana-usdt"
        "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv", // "localnet-ethereum-usdt"
        "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2", // "localnet-solana-lp-hexapool"
      ]);
    });
    it("throws an error if Solana wallet is not connected", () => {
      const interaction: SwapInteraction = {
        ...swapInteraction,
        connectedWallets: {
          ...swapInteraction.connectedWallets,
          [EcosystemId.Solana]: null,
        },
      };
      expect(() =>
        findMissingSplTokenAccountMints(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          interaction,
          defaultSplTokenAccounts,
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
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        type: InteractionType.Add,
        lpTokenTargetEcosystem: EcosystemId.Bsc,
        params: {
          inputAmounts: new Map(
            defaultAmounts.map((amount) => [amount.tokenId, amount]),
          ),
          minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
        },
      };
      result = createAddSteps(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        [],
        defaultSplTokenAccounts,
        txsByStep,
      );
    });

    it("generates steps for add interaction", () => {
      expect(result["createSplTokenAccounts"].isComplete).toBeFalsy();
      expect(result["wormholeToSolana"].isComplete).toBeFalsy();
    });
    it("finds missing token mints", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        defaultSplTokenAccounts,
      );
      expect(result.createSplTokenAccounts.mints).toEqual(mints);
    });
    it("generates required wormhole-to-Solana transfers", () => {
      const inputTransfersRes = generateInputTransfers(
        interaction.id,
        defaultSplTokenAccounts,
        poolTokens,
        [...interaction.params.inputAmounts.values()],
        interaction.signatureSetKeypairs,
      );
      expect(result.wormholeToSolana.transfers).toEqual({
        type: TransferType.Tokens,
        tokens: inputTransfersRes,
      });
    });
    it("generates a wormhole-from-Solana transfer for the LP token", () => {
      const resLpOutProtoTransfer = generateLpOutProtoTransfer(
        interaction.id,
        lpToken,
        interaction.lpTokenTargetEcosystem,
      );

      expect(result["wormholeFromSolana"].transfers).toEqual({
        type: TransferType.LpToken,
        lpToken: resLpOutProtoTransfer,
      });
    });
  });

  describe("createSwapSteps", () => {
    it("generates steps for swap interaction", () => {
      const result = createSwapSteps(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        swapInteraction,
        [],
        defaultSplTokenAccounts,
        txsByStep,
      );
      const mints = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        swapInteraction,
        defaultSplTokenAccounts,
      );

      const inputTransfersRes = generateInputTransfers(
        swapInteraction.id,
        defaultSplTokenAccounts,
        poolTokens,
        poolTokens.map((token) =>
          token.id === swapInteraction.params.exactInputAmount.tokenId
            ? swapInteraction.params.exactInputAmount
            : Amount.zero(token),
        ),
        swapInteraction.signatureSetKeypairs,
      );
      const resSingleOutputT = generateSingleOutputProtoTransfers(
        swapInteraction.id,
        poolTokens,
        2,
      );
      expect(result.createSplTokenAccounts.mints).toEqual(mints);
      expect(result.createSplTokenAccounts.isComplete).toBeFalsy();
      expect(result.wormholeToSolana.isComplete).toBeFalsy();
      expect(result.wormholeToSolana.transfers).toEqual({
        type: TransferType.Tokens,
        tokens: inputTransfersRes,
      });
      expect(result.wormholeFromSolana.transfers).toEqual({
        type: TransferType.Tokens,
        tokens: resSingleOutputT,
      });
      expect(result.wormholeFromSolana.knownAmounts).toBe(false);
      expect(result.doPoolOperations.isComplete).toBe(false);
    });
  });

  describe("createRemoveUniformSteps", () => {
    const interaction: RemoveUniformInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: defaultPoolId,
      poolIds: [defaultPoolId],
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
        [EcosystemId.Aurora]: null,
        [EcosystemId.Fantom]: null,
        [EcosystemId.Acala]: null,
      },
      lpTokenSourceEcosystem: EcosystemId.Solana,
      type: InteractionType.RemoveUniform,
      params: {
        exactBurnAmount: Amount.fromHuman(lpToken, new Decimal(20)),
        minimumOutputAmounts: new Map(),
      },
    };
    const result = createRemoveUniformSteps(
      defaultTokensByPoolId,
      defaultPoolSpecs,
      interaction,
      [],
      defaultSplTokenAccounts,
      txsByStep,
    );
    it("generates steps for remove uniform interaction", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        defaultSplTokenAccounts,
      );

      expect(result.createSplTokenAccounts.mints).toEqual(mints);
    });
  });

  describe("createRemoveExactBurnSteps", () => {
    const interaction: RemoveExactBurnInteraction = {
      id: defaultInteractionId,
      env: Env.Localnet,
      poolId: defaultPoolId,
      poolIds: [defaultPoolId],
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
        [EcosystemId.Aurora]: null,
        [EcosystemId.Fantom]: null,
        [EcosystemId.Acala]: null,
      },
      lpTokenSourceEcosystem: EcosystemId.Solana,
      type: InteractionType.RemoveExactBurn,
      params: {
        exactBurnAmount: Amount.fromHumanString(lpToken, "123"),
        minimumOutputAmount: Amount.fromHumanString(poolTokens[1], "89"),
      },
    };
    const result = createRemoveExactBurnSteps(
      defaultTokensByPoolId,
      defaultPoolSpecs,
      interaction,
      [
        {
          interactionId: defaultInteractionId,
          poolId: defaultPoolId,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount: interaction.params.exactBurnAmount,
            outputTokenIndex: 1,
            minimumOutputAmount: interaction.params.minimumOutputAmount,
          },
        },
      ],
      defaultSplTokenAccounts,
      txsByStep,
    );
    it("generates steps for remove exact burn interaction", () => {
      const mints = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        defaultSplTokenAccounts,
      );
      const resLpInTransfer = generateLpInTransfer(
        interaction.id,
        lpToken,
        interaction.params.exactBurnAmount,
        interaction.lpTokenSourceEcosystem,
        interaction.signatureSetKeypairs,
      );

      expect(result.createSplTokenAccounts.mints).toEqual(mints);
      expect(result.wormholeToSolana.transfers).toEqual({
        type: TransferType.LpToken,
        lpToken: resLpInTransfer,
      });
    });
  });
  describe("createRemoveExactOutputSteps", () => {
    it("generates steps for remove exact output interaction", () => {
      const interaction: RemoveExactOutputInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        lpTokenSourceEcosystem: EcosystemId.Solana,
        type: InteractionType.RemoveExactOutput,
        params: {
          maximumBurnAmount: Amount.fromHuman(lpToken, new Decimal(100)),
          exactOutputAmounts: new Map(
            defaultAmounts.map((amount) => [amount.tokenId, amount]),
          ),
        },
      };
      const result = createRemoveExactOutputSteps(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        [
          {
            interactionId: defaultInteractionId,
            poolId: defaultPoolId,
            instruction: SwimDefiInstruction.RemoveExactOutput,
            params: {
              maximumBurnAmount: interaction.params.maximumBurnAmount,
              exactOutputAmounts: defaultAmounts,
            },
          },
        ],
        defaultSplTokenAccounts,
        txsByStep,
      );
      const mints = findMissingSplTokenAccountMints(
        defaultTokensByPoolId,
        defaultPoolSpecs,
        interaction,
        defaultSplTokenAccounts,
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
        [...interaction.params.exactOutputAmounts.values()],
      );

      expect(result["createSplTokenAccounts"].mints).toEqual(mints);
      expect(result["wormholeToSolana"].transfers).toEqual({
        type: TransferType.LpToken,
        lpToken: resGenerateLpInTransfer,
      });
      expect(result["wormholeFromSolana"].knownAmounts).toBeTruthy();
      expect(result["wormholeFromSolana"].transfers).toEqual({
        type: TransferType.Tokens,
        tokens: resOutputTransfer,
      });
    });
  });
  describe("createSteps", () => {
    const config = configs[Env.Localnet];
    const chainsConfig: ChainsByProtocol = chains[Env.Localnet];
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
      [StepType.SolanaOperations]: {},
      [StepType.WormholeFromSolana]: wormholeFromSolanaTxs,
    };

    describe("add", () => {
      let addInteraction: AddInteraction;
      beforeEach(() => {
        addInteraction = {
          id: defaultInteractionId,
          env: Env.Localnet,
          poolId: defaultPoolId,
          poolIds: [defaultPoolId],
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
            [EcosystemId.Aurora]: null,
            [EcosystemId.Fantom]: null,
            [EcosystemId.Acala]: null,
          },
          type: InteractionType.Add,
          lpTokenTargetEcosystem: EcosystemId.Bsc,
          params: {
            inputAmounts: new Map(
              amounts.map((amount) => [amount.tokenId, amount]),
            ),
            minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
          },
        };
      });

      it("throws an error if wallet address is missing", () => {
        const getResult = () =>
          createSteps(config, addInteraction, [], defaultSplTokenAccounts, [
            solanaTx,
          ]);
        expect(getResult).toThrowError(/Missing Solana wallet/i);
      });
      it("throws an error if there is no signature set keypair", () => {
        const interactionWithWallet: AddInteraction = {
          ...addInteraction,
          connectedWallets: {
            ...addInteraction.connectedWallets,
            [EcosystemId.Solana]: defaultSolanaWalletAddress,
          },
        };
        const getResult = () =>
          createSteps(
            config,
            interactionWithWallet,
            [],
            defaultSplTokenAccounts,
            [solanaTx],
          );
        expect(getResult).toThrowError(/Missing signature set key pair/i);
      });
      it("returns result of createAddSteps", () => {
        const interactionWithWallet: AddInteraction = {
          ...addInteraction,
          signatureSetKeypairs,
          connectedWallets: {
            ...addInteraction.connectedWallets,
            [EcosystemId.Solana]: defaultSolanaWalletAddress,
          },
        };

        const expected = createAddSteps(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          interactionWithWallet,
          [
            {
              interactionId: defaultInteractionId,
              poolId: defaultPoolId,
              instruction: SwimDefiInstruction.Add,
              params: {
                inputAmounts: amounts,
                minimumMintAmount: Amount.fromHumanString(lpToken, "3000"),
              },
            },
          ],
          defaultSplTokenAccounts,
          txByStep,
        );
        const result = createSteps(
          config,
          interactionWithWallet,
          [],
          defaultSplTokenAccounts,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("swap", () => {
      const swapInteraction2: SwapInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        type: InteractionType.Swap,
        params: {
          exactInputAmount: Amount.fromHumanString(poolTokens[1], "3000"),
          minimumOutputAmount: Amount.fromHumanString(poolTokens[2], "3000"),
        },
      };
      it("returns result of createSwapSteps", () => {
        const result = createSwapSteps(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          swapInteraction2,
          [
            {
              interactionId: defaultInteractionId,
              poolId: defaultPoolId,
              instruction: SwimDefiInstruction.Swap,
              params: {
                exactInputAmounts: poolTokens.map((token) =>
                  token.id === swapInteraction2.params.exactInputAmount.tokenId
                    ? swapInteraction2.params.exactInputAmount
                    : Amount.zero(token),
                ),
                outputTokenIndex: 2,
                minimumOutputAmount:
                  swapInteraction2.params.minimumOutputAmount,
              },
            },
          ],
          defaultSplTokenAccounts,
          txByStep,
        );
        const expected = createSteps(
          config,
          swapInteraction2,
          [],
          defaultSplTokenAccounts,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("remove uniform", () => {
      const removeUniformInteraction: RemoveUniformInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        lpTokenSourceEcosystem: EcosystemId.Solana,
        type: InteractionType.RemoveUniform,
        params: {
          exactBurnAmount: Amount.fromHuman(lpToken, new Decimal(20)),
          minimumOutputAmounts: new Map(
            poolTokens.map((token) => [
              token.id,
              Amount.fromHumanString(token, "3"),
            ]),
          ),
        },
      };
      it("returns result of createRemoveUniformSteps", () => {
        const result = createRemoveUniformSteps(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          removeUniformInteraction,
          [
            {
              interactionId: defaultInteractionId,
              poolId: defaultPoolId,
              instruction: SwimDefiInstruction.RemoveUniform,
              params: {
                exactBurnAmount:
                  removeUniformInteraction.params.exactBurnAmount,
                minimumOutputAmounts: poolTokens.map((token) =>
                  Amount.fromHumanString(token, "3"),
                ),
              },
            },
          ],
          defaultSplTokenAccounts,
          txByStep,
        );
        const expected = createSteps(
          config,
          removeUniformInteraction,
          [],
          defaultSplTokenAccounts,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("remove exact burn", () => {
      const removeExactBurnInteraction: RemoveExactBurnInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        lpTokenSourceEcosystem: EcosystemId.Solana,
        type: InteractionType.RemoveExactBurn,
        params: {
          exactBurnAmount: Amount.fromHumanString(lpToken, "123"),
          minimumOutputAmount: Amount.fromHumanString(poolTokens[1], "89"),
        },
      };
      it("returns result of createRemoveExactBurnSteps", () => {
        const result = createRemoveExactBurnSteps(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          removeExactBurnInteraction,
          [
            {
              interactionId: defaultInteractionId,
              poolId: defaultPoolId,
              instruction: SwimDefiInstruction.RemoveExactBurn,
              params: {
                exactBurnAmount:
                  removeExactBurnInteraction.params.exactBurnAmount,
                outputTokenIndex: 1,
                minimumOutputAmount:
                  removeExactBurnInteraction.params.minimumOutputAmount,
              },
            },
          ],
          defaultSplTokenAccounts,
          txByStep,
        );
        const expected = createSteps(
          config,
          removeExactBurnInteraction,
          [],
          defaultSplTokenAccounts,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
    describe("remove exact output", () => {
      const removeExactOutputInteraction: RemoveExactOutputInteraction = {
        id: defaultInteractionId,
        env: Env.Localnet,
        poolId: defaultPoolId,
        poolIds: [defaultPoolId],
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
          [EcosystemId.Aurora]: null,
          [EcosystemId.Fantom]: null,
          [EcosystemId.Acala]: null,
        },
        lpTokenSourceEcosystem: EcosystemId.Solana,
        type: InteractionType.RemoveExactOutput,
        params: {
          maximumBurnAmount: Amount.fromHuman(lpToken, new Decimal(100)),
          exactOutputAmounts: new Map(
            defaultAmounts.map((amount) => [amount.tokenId, amount]),
          ),
        },
      };
      it("returns result of createRemoveExactOutputSteps", () => {
        const result = createRemoveExactOutputSteps(
          defaultTokensByPoolId,
          defaultPoolSpecs,
          removeExactOutputInteraction,
          [
            {
              interactionId: defaultInteractionId,
              poolId: defaultPoolId,
              instruction: SwimDefiInstruction.RemoveExactOutput,
              params: {
                maximumBurnAmount:
                  removeExactOutputInteraction.params.maximumBurnAmount,
                exactOutputAmounts: defaultAmounts,
              },
            },
          ],
          defaultSplTokenAccounts,
          txByStep,
        );
        const expected = createSteps(
          config,
          removeExactOutputInteraction,
          [],
          defaultSplTokenAccounts,
          [solanaTx],
        );
        expect(result).toEqual(expected);
      });
    });
  });
});
