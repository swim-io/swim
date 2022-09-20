import type { SolanaConnection } from "@swim-io/solana";
import { useContext } from "react";

import { SolanaConnectionContext } from "../../contexts";

export const useSolanaConnection = (): SolanaConnection => {
  const solanaConnection = useContext(SolanaConnectionContext);
  if (!solanaConnection) {
    throw new Error("Missing Solana connection context");
  }
  return solanaConnection;
};
