import type { MintInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import type { PoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { useSolanaConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import { deserializeMint } from "../../models";
import { findOrThrow } from "../../utils";

export const usePoolLpMints = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<MintInfo | null, Error>[] => {
  const {
    env,
    config: { tokens },
  } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const lpTokens = poolSpecs.map((poolSpec) =>
    findOrThrow(tokens, (tokenSpec) => tokenSpec.id === poolSpec.lpToken),
  );
  const lpTokenMintAddresses = lpTokens.map(
    (lpToken) => getSolanaTokenDetails(lpToken).address,
  );

  return useQueries(
    poolSpecs.map((poolSpec, i) => ({
      queryKey: ["poolLpMintAccount", env, poolSpec.id],
      queryFn: async () => {
        const account = await solanaConnection.getAccountInfo(
          new PublicKey(lpTokenMintAddresses[i]),
        );
        return account ? deserializeMint(account.data) : null;
      },
    })),
  ) as readonly UseQueryResult<MintInfo | null, Error>[];
};

export const usePoolLpMint = (
  poolSpec: PoolSpec,
): UseQueryResult<MintInfo | null, Error> => usePoolLpMints([poolSpec])[0];
