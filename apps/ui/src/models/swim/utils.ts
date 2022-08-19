import type { Account as TokenAccount } from "@solana/spl-token";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";
import { filterMap, findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { EcosystemId, PoolSpec, TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";
import { Amount } from "../amount";

import type { InteractionSpec, InteractionSpecV2 } from "./interaction";
import { InteractionType } from "./interaction";
import { getRequiredPools } from "./steps";

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
      return tokenSpec.nativeEcosystemId;
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
        SOLANA_ECOSYSTEM_ID,
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
        SOLANA_ECOSYSTEM_ID,
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
      const outputEcosystem = outputToken.nativeEcosystemId;
      return new Set([
        SOLANA_ECOSYSTEM_ID,
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
        SOLANA_ECOSYSTEM_ID,
        lpTokenSourceEcosystem,
        ...outputEcosystems,
      ]);
    }
    case InteractionType.Swap: {
      const {
        params: { exactInputAmount, minimumOutputAmount },
      } = interactionSpec;
      const inputEcosystem = exactInputAmount.tokenSpec.nativeEcosystemId;
      const outputEcosystem = minimumOutputAmount.tokenSpec.nativeEcosystemId;
      return new Set([SOLANA_ECOSYSTEM_ID, inputEcosystem, outputEcosystem]);
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
      [SOLANA_ECOSYSTEM_ID]: null,
      [EvmEcosystemId.Ethereum]: null,
      [EvmEcosystemId.Bnb]: null,
      [EvmEcosystemId.Avalanche]: null,
      [EvmEcosystemId.Polygon]: null,
      [EvmEcosystemId.Aurora]: null,
      [EvmEcosystemId.Fantom]: null,
      [EvmEcosystemId.Karura]: null,
      [EvmEcosystemId.Acala]: null,
    },
  );
};

export const getRequiredEcosystemsV2 = (
  interactionSpec: InteractionSpecV2,
  poolSpecs: readonly PoolSpec[],
): ReadonlySet<EcosystemId> => {
  switch (interactionSpec.type) {
    case InteractionType.Add:
    case InteractionType.RemoveUniform:
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput: {
      const { poolId } = interactionSpec;
      const poolSpec = findOrThrow(poolSpecs, (pool) => pool.id === poolId);
      return new Set([poolSpec.ecosystem]);
    }
    case InteractionType.SwapV2: {
      const requiredPools = getRequiredPools(poolSpecs, interactionSpec);
      return new Set(requiredPools.map((pool) => pool.ecosystem));
    }
    default:
      throw new Error("Unknown instruction");
  }
};

export const getConnectedWalletsV2 = (
  interactionSpec: InteractionSpecV2,
  poolSpecs: readonly PoolSpec[],
  wallets: ReadonlyRecord<EcosystemId, BaseWallet>,
): ReadonlyRecord<EcosystemId, string | null> => {
  const requiredEcosystems = getRequiredEcosystemsV2(
    interactionSpec,
    poolSpecs,
  );
  return Object.entries(wallets).reduce(
    (accumulator, [ecosystemId, { address }]) =>
      requiredEcosystems.has(ecosystemId as EcosystemId)
        ? {
            ...accumulator,
            [ecosystemId]: address,
          }
        : accumulator,
    {
      [SOLANA_ECOSYSTEM_ID]: null,
      [EvmEcosystemId.Ethereum]: null,
      [EvmEcosystemId.Bnb]: null,
      [EvmEcosystemId.Avalanche]: null,
      [EvmEcosystemId.Polygon]: null,
      [EvmEcosystemId.Aurora]: null,
      [EvmEcosystemId.Fantom]: null,
      [EvmEcosystemId.Karura]: null,
      [EvmEcosystemId.Acala]: null,
    },
  );
};

export const getPoolUsdValue = (
  tokens: readonly TokenSpec[],
  poolTokenAccounts: readonly TokenAccount[],
): Decimal | null =>
  tokens.every(
    (tokenSpec) => TOKEN_PROJECTS_BY_ID[tokenSpec.projectId].isStablecoin,
  )
    ? poolTokenAccounts.reduce((acc, account) => {
        const tokenSpec = tokens.find(
          (spec) =>
            getTokenDetailsForEcosystem(spec, SOLANA_ECOSYSTEM_ID)?.address ===
            account.mint.toBase58(),
        );
        if (!tokenSpec) {
          throw new Error("Token spec not found");
        }
        return acc.add(
          Amount.fromU64(
            tokenSpec,
            account.amount,
            SOLANA_ECOSYSTEM_ID,
          ).toHuman(SOLANA_ECOSYSTEM_ID),
        );
      }, new Decimal(0))
    : null;

export const isValidSlippageFraction = (
  slippageFraction: Decimal | null,
): boolean =>
  slippageFraction !== null &&
  slippageFraction.greaterThanOrEqualTo(0) &&
  slippageFraction.lessThanOrEqualTo(1);
