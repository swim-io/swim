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

// @typescript-eslint/no-unsafe-member-access has bug on imported enum
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const MESSAGES: Partial<ReadonlyRecord<StatusCode, string>> = {
  [StatusCode.INTERNAL]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.INVALID_ARGUMENT]: INTERNAL_ERROR_MESSAGE,
  [StatusCode.NOT_FOUND]:
    "Could not confirm transfer with Wormhole guardians. This usually happens when the source blockchain is congested. Please try again later.",
  [StatusCode.UNAVAILABLE]: UNAVAILABLE_MESSAGE,
  [StatusCode.UNKNOWN]: UNAVAILABLE_MESSAGE,
};
/* eslint-enable @typescript-eslint/no-unsafe-member-access */

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry = (
  ...args
) =>
  originalGetSignedVAAWithRetry(...args).catch((error) => {
    if (isRpcError(error)) {
      // bug on @typescript-eslint/no-unsafe-member-access to treat `error` as any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const message = MESSAGES[error.code];
      if (message) throw new SwimError(message, error);
    }

    throw error;
  });
