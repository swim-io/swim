import { getSignedVAAWithRetry as originalGetSignedVAAWithRetry } from "@certusone/wormhole-sdk";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";

import { SwimError } from "../../errors";

const isRpcError = (error: unknown): error is RpcError => {
  return error instanceof Error && "code" in error;
};

// Common RPC errors as seen in Swim
// message: requested VAA not found in store, code: 5
// message: Response closed without headers, code: 2

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry = (
  ...args
) =>
  originalGetSignedVAAWithRetry(...args).catch((error) => {
    if (isRpcError(error) && error.code === StatusCode.UNKNOWN) {
      throw new SwimError(
        "We are unable to reach the wormhole network. Please try again later.",
        error,
      );
    }

    throw error;
  });
