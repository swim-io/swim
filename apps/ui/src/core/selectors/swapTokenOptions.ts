import { findOrThrow } from "@swim-io/utils";

import { isSwimUsd } from "../../config";
import type { TokenOption } from "../../models";
import type { EnvironmentState } from "../store";

import { selectConfig } from "./environment";

export const selectSwapTokenOptions = (
  state: EnvironmentState,
): readonly TokenOption[] => {
  const { pools, tokens } = selectConfig(state);
  const restructuredPools = pools.filter((pool) => !pool.isLegacyPool);
  const nonLpTokenConfigs = restructuredPools
    .filter((pool) => !pool.isStakingPool)
    .flatMap((pool) => pool.tokens)
    // Remove duplicated tokenId
    .filter((tokenId, index, tokenIds) => tokenIds.indexOf(tokenId) === index)
    .filter((tokenId) =>
      restructuredPools.every((pool) => pool.lpToken !== tokenId),
    )
    .map((tokenId) => findOrThrow(tokens, ({ id }) => id === tokenId));
  const nonLpTokenOptions = nonLpTokenConfigs.map((spec) => ({
    tokenId: spec.id,
    ecosystemId: spec.nativeEcosystemId,
  }));

  const swimUsdSpec = findOrThrow(tokens, isSwimUsd);
  const swimUsdOptions = [
    swimUsdSpec.nativeEcosystemId,
    ...swimUsdSpec.wrappedDetails.keys(),
  ].map((ecosystemId) => ({
    tokenId: swimUsdSpec.id,
    ecosystemId,
  }));
  return [...nonLpTokenOptions, ...swimUsdOptions];
};
