import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { filterMap, findOrThrow } from "../../utils";
import { Amount } from "../amount";

import type { InteractionSpec } from "./interaction";
import { InteractionType } from "./interaction";
import { TransferType } from "./transfer";
import type { TransferToSolana, Transfers } from "./transfer";

// NOTE: These are only needed for transfers to Solana during the post VAA process
export const generateSignatureSetKeypairs = (
  poolTokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interactionSpec: InteractionSpec,
  transfers: Transfers<TransferToSolana> | null,
): ReadonlyRecord<string, Keypair | undefined> => {
  switch (interactionSpec.type) {
    case InteractionType.Add: {
      if (transfers !== null && transfers.type === TransferType.LpToken) {
        throw new Error("Invalid transfers type");
      }
      const { inputAmounts } = interactionSpec.params;
      return poolTokens.reduce((accumulator, token, i) => {
        const inputAmount = inputAmounts.get(token.id) ?? null;
        return token.nativeEcosystem !== EcosystemId.Solana &&
          inputAmount !== null &&
          !inputAmount.isZero() &&
          !transfers?.tokens[i]?.isComplete
          ? { ...accumulator, [token.id]: Keypair.generate() }
          : accumulator;
      }, {});
    }
    case InteractionType.Swap: {
      if (transfers !== null && transfers.type === TransferType.LpToken) {
        throw new Error("Invalid transfers type");
      }
      const { exactInputAmount } = interactionSpec.params;
      return poolTokens.reduce((accumulator, token, i) => {
        return token.nativeEcosystem !== EcosystemId.Solana &&
          token.id === exactInputAmount.tokenId &&
          !exactInputAmount.isZero() &&
          !transfers?.tokens[i]?.isComplete
          ? { ...accumulator, [token.id]: Keypair.generate() }
          : accumulator;
      }, {});
    }
    case InteractionType.RemoveUniform:
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput: {
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

const mapNonZeroAmountsToNativeEcosystems = (
  tokens: readonly TokenSpec[],
  amounts: readonly Amount[],
): readonly EcosystemId[] =>
  filterMap(
    (amount: Amount) => !amount.isZero(),
    (amount) => {
      const tokenSpec = findOrThrow(
        tokens,
        (token) => token.id === amount.tokenId,
      );
      return tokenSpec.nativeEcosystem;
    },
    amounts,
  );

export const getRequiredEcosystems = (
  tokens: readonly TokenSpec[],
  interactionSpec: InteractionSpec,
): ReadonlySet<EcosystemId> => {
  switch (interactionSpec.type) {
    case InteractionType.Add: {
      const { params, lpTokenTargetEcosystem } = interactionSpec;
      const inputEcosystems = mapNonZeroAmountsToNativeEcosystems(tokens, [
        ...params.inputAmounts.values(),
      ]);
      return new Set([
        EcosystemId.Solana,
        lpTokenTargetEcosystem,
        ...inputEcosystems,
      ]);
    }
    case InteractionType.RemoveUniform: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const outputEcosystems = mapNonZeroAmountsToNativeEcosystems(tokens, [
        ...params.minimumOutputAmounts.values(),
      ]);
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...outputEcosystems,
      ]);
    }
    case InteractionType.RemoveExactBurn: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const outputToken = findOrThrow(
        tokens,
        (token) => token.id === params.minimumOutputAmount.tokenId,
      );
      const outputEcosystem = outputToken.nativeEcosystem;
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        outputEcosystem,
      ]);
    }
    case InteractionType.RemoveExactOutput: {
      const { params, lpTokenSourceEcosystem } = interactionSpec;
      const outputEcosystems = mapNonZeroAmountsToNativeEcosystems(tokens, [
        ...params.exactOutputAmounts.values(),
      ]);
      return new Set([
        EcosystemId.Solana,
        lpTokenSourceEcosystem,
        ...outputEcosystems,
      ]);
    }
    case InteractionType.Swap: {
      const {
        params: { exactInputAmount, minimumOutputAmount },
      } = interactionSpec;
      const inputEcosystem = exactInputAmount.tokenSpec.nativeEcosystem;
      const outputEcosystem = minimumOutputAmount.tokenSpec.nativeEcosystem;
      return new Set([EcosystemId.Solana, inputEcosystem, outputEcosystem]);
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
  tokens: readonly TokenSpec[],
  interactionSpec: InteractionSpec,
  wallets: ReadonlyRecord<EcosystemId, BaseWallet>,
): ReadonlyRecord<EcosystemId, string | null> => {
  const requiredEcosystems = getRequiredEcosystems(tokens, interactionSpec);
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
      [EcosystemId.Aurora]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Karura]: null,
      [EcosystemId.Acala]: null,
    },
  );
};

export const getPoolUsdValue = (
  tokens: readonly TokenSpec[],
  poolTokenAccounts: readonly TokenAccount[],
): Decimal | null =>
  tokens.every((tokenSpec) => tokenSpec.isStablecoin)
    ? poolTokenAccounts.reduce((acc, account) => {
        const tokenSpec = tokens.find(
          (spec) =>
            spec.detailsByEcosystem.get(EcosystemId.Solana)?.address ===
            account.mint.toBase58(),
        );
        if (!tokenSpec) {
          throw new Error("Token spec not found");
        }
        return acc.add(
          Amount.fromU64(tokenSpec, account.amount, EcosystemId.Solana).toHuman(
            EcosystemId.Solana,
          ),
        );
      }, new Decimal(0))
    : null;

export const isValidSlippageFraction = (
  slippageFraction: Decimal | null,
): boolean =>
  slippageFraction !== null &&
  slippageFraction.greaterThanOrEqualTo(0) &&
  slippageFraction.lessThanOrEqualTo(1);
