import { getSignedVAAWithRetry as originalGetSignedVAAWithRetry } from "@certusone/wormhole-sdk";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";

import { SwimWormholeError, SwimWormholeErrorCode } from "./errors";

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
      ReadonlyRecord<StatusCode, SwimWormholeErrorCode>
    > = {
      [StatusCode.INTERNAL]: SwimWormholeErrorCode.InternalError,
      [StatusCode.INVALID_ARGUMENT]: SwimWormholeErrorCode.InternalError,
      [StatusCode.NOT_FOUND]:
        SwimWormholeErrorCode.GuardiansCannotConfirmTransfer,
      [StatusCode.UNAVAILABLE]: SwimWormholeErrorCode.GuardiansCannotReach,
      [StatusCode.UNKNOWN]: SwimWormholeErrorCode.GuardiansCannotReach,
    };

    return await originalGetSignedVAAWithRetry(...args).catch((error) => {
      if (isRpcError(error)) {
        const mappedErrorCode = errorCodeMapping[error.code];
        if (mappedErrorCode)
          throw new SwimWormholeError({ code: mappedErrorCode, cause: error });
      }

      throw error;
    });
  };
