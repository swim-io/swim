import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId } from "@swim-io/token-projects";
import shallow from "zustand/shallow.js";

import type { TokenConfig } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

type WormholeTokenOptionsResult = {
  readonly wormholeTokens: readonly TokenConfig[];
  readonly tokenIds: readonly string[];
};

export const useWormholeFromTokenOptions = (): WormholeTokenOptionsResult => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const tempObject: TokenConfig = {
    id: "",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: { address: "", decimals: 0 },
    wrappedDetails: new Map(),
  };
  const wormholeTokens = tokens
    .filter((token) => token.wrappedDetails.size > 0 && !token.isDisabled)
    .flatMap((token) => {
      const formattedTokens = [token];
      for (const [key, value] of token.wrappedDetails) {
        const wrappedToken = {
          ...tempObject,
          id: `${token.id}-wrapped-${token.nativeEcosystemId}`,
          projectId: token.projectId,
          nativeEcosystemId: key,
          nativeDetails: { ...value },
        };
        // eslint-disable-next-line functional/immutable-data
        formattedTokens.push(wrappedToken);
      }
      return formattedTokens;
    });
  const tokenIds = wormholeTokens.map((token) => token.id);
  return { wormholeTokens, tokenIds };
};
