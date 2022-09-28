import type { SolanaClient } from "@swim-io/solana";
import { useContext } from "react";

import { SolanaClientContext } from "../../contexts";

export const useSolanaClient = (): SolanaClient => {
  const solanaClient = useContext(SolanaClientContext);
  if (!solanaClient) {
    throw new Error("Missing Solana client context");
  }
  return solanaClient;
};
