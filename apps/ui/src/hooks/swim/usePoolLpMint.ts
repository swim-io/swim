import type { MintInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { PoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { useConfig, useEnvironment, useSolanaConnection } from "../../contexts";
import { deserializeMint } from "../../models";
import { findOrThrow } from "../../utils";

export const usePoolLpMint = (
  poolSpec: PoolSpec,
): UseQueryResult<MintInfo | null, Error> => {
  const { env } = useEnvironment();
  const { tokens } = useConfig();
  const solanaConnection = useSolanaConnection();
  const lpToken = findOrThrow(
    tokens,
    (tokenSpec) => tokenSpec.id === poolSpec.lpToken,
  );
  const lpTokenMintAddress = getSolanaTokenDetails(lpToken).address;

  return useQuery<MintInfo | null, Error>(
    ["poolLpMintAccount", env, poolSpec.id],
    async () => {
      const account = await solanaConnection.getAccountInfo(
        new PublicKey(lpTokenMintAddress),
      );
      return account ? deserializeMint(account.data) : null;
    },
  );
};
