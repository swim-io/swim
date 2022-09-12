import { getSignedVAAWithRetry as originalGetSignedVAAWithRetry } from "@certusone/wormhole-sdk";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";

import { WormholeError, WormholeErrorCode } from "./errors";

const isRpcError = (error: unknown): error is RpcError => {
  return (
    error instanceof Error &&
    "code" in error &&
    Object.values(StatusCode).includes(
      (error as Record<string, unknown>).code as string,
    )
  );
};

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry =
  async (...args) => {
    // Common RPC errors as seen in Swim
    // message: requested VAA not found in store, code: 5 (StatusCode.NOT_FOUND)
    // message: Response closed without headers, code: 2 (StatusCode.UNKNOWN)
    const errorCodeMapping: Partial<
      ReadonlyRecord<StatusCode, WormholeErrorCode>
    > = {
      [StatusCode.INTERNAL]: WormholeErrorCode.InternalError,
      [StatusCode.INVALID_ARGUMENT]: WormholeErrorCode.InternalError,
      [StatusCode.NOT_FOUND]: WormholeErrorCode.GuardiansCannotConfirmTransfer,
      [StatusCode.UNAVAILABLE]: WormholeErrorCode.GuardiansCannotReach,
      [StatusCode.UNKNOWN]: WormholeErrorCode.GuardiansCannotReach,
    };

    return await originalGetSignedVAAWithRetry(...args).catch((error) => {
      if (isRpcError(error)) {
        const mappedErrorCode = errorCodeMapping[error.code];
        if (mappedErrorCode) throw new WormholeError(mappedErrorCode, error);
      }

      throw error;
    });
  };
