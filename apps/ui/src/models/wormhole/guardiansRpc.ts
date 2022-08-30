import { getSignedVAAWithRetry as originalGetSignedVAAWithRetry } from "@certusone/wormhole-sdk";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { RpcError } from "grpc-web";
import { StatusCode } from "grpc-web";

import { SwimError } from "../../errors";
import { i18next } from "../../i18n";

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
    const INTERNAL_ERROR_MESSAGE = i18next.t("general.internal_vaa_error");
    const UNAVAILABLE_MESSAGE = i18next.t("general.unreachable_vaa_error");

    // Common RPC errors as seen in Swim
    // message: requested VAA not found in store, code: 5 (StatusCode.NOT_FOUND)
    // message: Response closed without headers, code: 2 (StatusCode.UNKNOWN)
    const MESSAGES: Partial<ReadonlyRecord<StatusCode, string>> = {
      [StatusCode.INTERNAL]: INTERNAL_ERROR_MESSAGE,
      [StatusCode.INVALID_ARGUMENT]: INTERNAL_ERROR_MESSAGE,
      [StatusCode.NOT_FOUND]: i18next.t(
        "general.cannot_confirm_transfer_vaa_error",
      ),
      [StatusCode.UNAVAILABLE]: UNAVAILABLE_MESSAGE,
      [StatusCode.UNKNOWN]: UNAVAILABLE_MESSAGE,
    };

    return await originalGetSignedVAAWithRetry(...args).catch((error) => {
      if (isRpcError(error)) {
        const message = MESSAGES[error.code];
        if (message) throw new SwimError(message, error);
      }

      throw error;
    });
  };
