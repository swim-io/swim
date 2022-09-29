import type { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SOLANA_ECOSYSTEM_ID, deserializeMint } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useSolanaClient } from "../solana";

export const usePoolLpMints = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<Mint | null, Error>[] => {
  const { env } = useEnvironment();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const solanaClient = useSolanaClient();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: [env, "poolLpMintAccount", poolSpec.id],
      queryFn: async () => {
        if (poolSpec.ecosystem !== SOLANA_ECOSYSTEM_ID) {
          return null;
        }
        const lpToken = findOrThrow(
          tokens,
          (tokenConfig) => tokenConfig.id === poolSpec.lpToken,
        );
        const lpTokenMintPubkey = new PublicKey(
          getSolanaTokenDetails(lpToken).address,
        );
        const account = await solanaClient.rawConnection.getAccountInfo(
          lpTokenMintPubkey,
        );
        return account
          ? deserializeMint(lpTokenMintPubkey, account.data)
          : null;
      },
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Mint | null, Error>[];
};

export const usePoolLpMint = (
  poolSpec: PoolSpec,
): UseQueryResult<Mint | null, Error> => usePoolLpMints([poolSpec])[0];
