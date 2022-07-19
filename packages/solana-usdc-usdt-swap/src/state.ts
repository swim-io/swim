import type { Connection } from "@solana/web3.js";
import { deserializeSwimPool } from "@swim-io/solana-types";

import type { SwimPool } from "./hexapool";
import { hexapool } from "./hexapool";

export const getSwimPool = async (
  solanaConnection: Connection,
): Promise<SwimPool> => {
  const accountInfo = await solanaConnection.getAccountInfo(hexapool.stateKey);
  if (accountInfo === null) {
    throw new Error("Could not retrieve account info");
  }
  const poolState = deserializeSwimPool(
    hexapool.numberOfTokens,
    accountInfo.data,
  );
  return {
    ...hexapool,
    ...poolState,
  };
};
