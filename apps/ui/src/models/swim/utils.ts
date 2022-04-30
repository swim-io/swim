import { Keypair } from "@solana/web3.js";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";

import { SwimDefiInstruction } from "./instructions";
import type { InteractionSpec } from "./interaction";
import { TransferType } from "./transfer";
import type { TransferToSolana, Transfers } from "./transfer";

// NOTE: These are only needed for transfers to Solana during the post VAA process
export const generateSignatureSetKeypairs = (
  poolTokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interactionSpec: InteractionSpec,
  transfers: Transfers<TransferToSolana> | null,
): ReadonlyRecord<string, Keypair | undefined> => {
  switch (interactionSpec.instruction) {
    case SwimDefiInstruction.Add: {
      if (transfers !== null && transfers.type === TransferType.LpToken) {
        throw new Error("Invalid transfers type");
      }
      const { params } = interactionSpec;
      return poolTokens.reduce(
        (accumulator, token, i) =>
          token.nativeEcosystem !== EcosystemId.Solana &&
          !params.inputAmounts[i].isZero() &&
          !transfers?.tokens[i]?.isComplete
            ? { ...accumulator, [token.id]: Keypair.generate() }
            : accumulator,
        {},
      );
    }
    case SwimDefiInstruction.Swap: {
      if (transfers !== null && transfers.type === TransferType.LpToken) {
        throw new Error("Invalid transfers type");
      }
      const { params } = interactionSpec;
      return poolTokens.reduce(
        (accumulator, token, i) =>
          token.nativeEcosystem !== EcosystemId.Solana &&
          !params.exactInputAmounts[i].isZero() &&
          !transfers?.tokens[i]?.isComplete
            ? {
                ...accumulator,
                [token.id]: Keypair.generate(),
              }
            : accumulator,
        {},
      );
    }
    case SwimDefiInstruction.RemoveUniform:
    case SwimDefiInstruction.RemoveExactBurn:
    case SwimDefiInstruction.RemoveExactOutput: {
      if (transfers !== null && transfers.type === TransferType.Tokens) {
        throw new Error("Invalid transfers type");
      }
      const { lpTokenSourceEcosystem } = interactionSpec;
      return lpTokenSourceEcosystem !== EcosystemId.Solana &&
        !transfers?.lpToken?.isComplete
        ? {
            [lpToken.id]: Keypair.generate(),
          }
        : {};
    }
    default:
      throw new Error("Unknown instruction");
  }
};

export const getSignatureSetAddresses = (
  signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>,
): ReadonlyRecord<string, string | undefined> =>
  Object.entries(signatureSetKeypairs).reduce(
    (accumulator, [tokenId, keypair]) => ({
      ...accumulator,
      [tokenId]: keypair?.publicKey.toBase58(),
    }),
    {},
  );

const getRequiredEcosystems = (
  poolTokens: readonly TokenSpec[],
  interactionSpec: InteractionSpec,
): ReadonlySet<EcosystemId> => {
  const poolTokenEcosystems = poolTokens.map((token) => token.nativeEcosystem);
  switch (interactionSpec.instruction) {
    case SwimDefiInstruction.Add: {
      const { params, lpTokenTargetEcosystem } = interactionSpec;
      const tokenEcosystems = poolTokenEcosystems.filter(
        (_, i) => !params.inputAmounts[i].isZero(),
      );
      return new Set([
        EcosystemId.Solana,
        lpTokenTargetEcosystem,
        ...tokenEcosystems,
      ]);
    }
    case SwimDefiInstruction.Swap: {
      const { params } = interactionSpec;
      const tokenEcosystems = poolTokenEcosystems.filter(
        (_, i) =>
          i === params.outputTokenIndex ||
          !params.exactInputAmounts[i].isZero(),
      );
      return new Set([EcosystemId.Solana, ...tokenEcosystems]);
    }
    case SwimDefiInstruction.RemoveUniform: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const tokenEcosystems = poolTokenEcosystems.filter(
        (_, i) => !params.minimumOutputAmounts[i].isZero(),
      );
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...tokenEcosystems,
      ]);
    }
    case SwimDefiInstruction.RemoveExactBurn: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const tokenEcosystems = poolTokenEcosystems.filter(
        (_, i) => i === params.outputTokenIndex,
      );
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...tokenEcosystems,
      ]);
    }
    case SwimDefiInstruction.RemoveExactOutput: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const tokenEcosystems = poolTokenEcosystems.filter(
        (_, i) => !params.exactOutputAmounts[i].isZero(),
      );
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...tokenEcosystems,
      ]);
    }
    default:
      throw new Error("Unknown instruction");
  }
};

export interface BaseWallet {
  readonly address: string | null;
  readonly connected: boolean;
}

export const getConnectedWallets = (
  poolTokens: readonly TokenSpec[],
  interactionSpec: InteractionSpec,
  wallets: ReadonlyRecord<EcosystemId, BaseWallet>,
): ReadonlyRecord<EcosystemId, string | null> => {
  const requiredEcosystems = getRequiredEcosystems(poolTokens, interactionSpec);
  return Object.entries(wallets).reduce(
    (accumulator, [ecosystemId, { address }]) =>
      requiredEcosystems.has(ecosystemId as EcosystemId)
        ? {
            ...accumulator,
            [ecosystemId]: address,
          }
        : accumulator,
    {
      [EcosystemId.Solana]: null,
      [EcosystemId.Ethereum]: null,
      [EcosystemId.Bsc]: null,
      [EcosystemId.Terra]: null,
      [EcosystemId.Avalanche]: null,
      [EcosystemId.Polygon]: null,
    },
  );
};
