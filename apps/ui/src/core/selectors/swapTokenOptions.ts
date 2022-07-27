import { findOrThrow } from "@swim-io/utils";

import type { TokenOption } from "../../models";
import type { EnvironmentState } from "../store";

import { selectConfig } from "./environment";

const swimUsdRegExp = /-swimusd$/;
const isSwimUsdTokenId = (tokenId: string): boolean =>
  swimUsdRegExp.test(tokenId);

export const selectSwapTokenOptions = (
  state: EnvironmentState,
): readonly TokenOption[] => {
  const { pools, tokens } = selectConfig(state);
  const restructuredPools = pools.filter((pool) => !pool.isLegacyPool);
  const nonLpTokenSpecs = restructuredPools
    .filter((pool) => !pool.isStakingPool)
    .flatMap((pool) => pool.tokens)
    // Remove duplicated tokenId
    .filter((tokenId, index, tokenIds) => tokenIds.indexOf(tokenId) === index)
    .filter((tokenId) =>
      restructuredPools.every((pool) => pool.lpToken !== tokenId),
    )
    .map((tokenId) => findOrThrow(tokens, ({ id }) => id === tokenId));
  const nonLpTokenOptions = nonLpTokenSpecs.map((spec) => ({
    tokenId: spec.id,
    ecosystemId: spec.nativeEcosystem,
  }));

  const swimUsdSpec = findOrThrow(tokens, (token) =>
    isSwimUsdTokenId(token.id),
  );
  const swimUsdOptions = [...swimUsdSpec.detailsByEcosystem.keys()].map(
    (ecosystemId) => ({
      tokenId: swimUsdSpec.id,
      ecosystemId,
    }),
  );
  return [...nonLpTokenOptions, ...swimUsdOptions];
};
