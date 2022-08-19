import type { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { deserializeMint } from "../../models";
import { useSolanaConnection } from "../solana";

export const usePoolLpMints = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<Mint | null, Error>[] => {
  const { env } = useEnvironment();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const solanaConnection = useSolanaConnection();

  return useQueries(
    poolSpecs.map((poolSpec, i) => ({
      queryKey: ["poolLpMintAccount", env, poolSpec.id],
      queryFn: async () => {
        if (poolSpec.ecosystem !== SOLANA_ECOSYSTEM_ID) {
          return null;
        }
        const lpToken = findOrThrow(
          tokens,
          (tokenSpec) => tokenSpec.id === poolSpec.lpToken,
        );
        const lpTokenMintAddress = getSolanaTokenDetails(lpToken).address;
        const account = await solanaConnection.getAccountInfo(
          new PublicKey(lpTokenMintAddress),
        );
        return account ? deserializeMint(account.data) : null;
      },
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Mint | null, Error>[];
};

export const usePoolLpMint = (
  poolSpec: PoolSpec,
): UseQueryResult<Mint | null, Error> => usePoolLpMints([poolSpec])[0];
