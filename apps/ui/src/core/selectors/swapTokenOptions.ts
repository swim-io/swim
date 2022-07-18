import type { EcosystemId } from "../../config";
import { findOrThrow } from "../../utils";
import type { EnvironmentState } from "../store";

import { selectConfig } from "./environment";

interface TokenOption {
  readonly tokenId: string;
  readonly ecosystemId: EcosystemId;
}

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
