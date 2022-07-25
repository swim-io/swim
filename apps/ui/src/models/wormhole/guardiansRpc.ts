import { getSignedVAAWithRetry as originalGetSignedVAAWithRetry } from "@certusone/wormhole-sdk";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";

import { SwimError } from "../../errors";
import type { ReadonlyRecord } from "../../utils";

const isRpcError = (error: unknown): error is RpcError => {
  return (
    error instanceof Error &&
    "code" in error &&
    Object.values(StatusCode).includes(
      (error as Record<string, unknown>).code as string,
    )
  );
};

// Common RPC errors as seen in Swim
// message: requested VAA not found in store, code: 5 (StatusCode.NOT_FOUND)
// message: Response closed without headers, code: 2 (StatusCode.UNKNOWN)

const INTERNAL_ERROR_MESSAGE =
  "Something went wrong, please contact Swim support.";
const UNAVAILABLE_MESSAGE =
  "We are unable to reach the Wormhole guardians. Please try again later.";

const MESSAGES: Partial<ReadonlyRecord<StatusCode, string>> = {
  [StatusCode.INTERNAL]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.INVALID_ARGUMENT]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.NOT_FOUND]:
    "Could not confirm transfer with Wormhole guardians. This usually happens when the source blockchain is congested. Please try again later.",
  [StatusCode.UNAVAILABLE]: UNAVAILABLE_MESSAGE,
  [StatusCode.UNKNOWN]: UNAVAILABLE_MESSAGE,
};

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry = (
  ...args
) =>
  originalGetSignedVAAWithRetry(...args).catch((error) => {
    if (isRpcError(error)) {
      const message = MESSAGES[error.code];
      if (message) throw new SwimError(message, error);
    }

    throw error;
  });
