import { useContext } from "react";

import { SolanaConnectionContext } from "../../contexts/SolanaConnection";
import type { SolanaConnection } from "../../models/solana";

export const useSolanaConnection = (): SolanaConnection => {
  const solanaConnection = useContext(SolanaConnectionContext);
  if (!solanaConnection) {
    throw new Error("Missing Solana connection context");
  }
  return solanaConnection;
};
