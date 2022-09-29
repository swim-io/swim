import type { AptosClient } from "@swim-io/aptos";
import { useContext } from "react";

import { AptosClientContext } from "../../contexts";

export const useAptosClient = (): AptosClient => {
  const aptosClient = useContext(AptosClientContext);
  if (!aptosClient) {
    throw new Error("Missing Aptos client context");
  }
  return aptosClient;
};
