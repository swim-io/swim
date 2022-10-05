import type { SwimErrorCode } from "@swim-io/core";
import { isSwimError } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import {
  SwimWormholeErrorCode,
  getSignedVaaWithRetry as originalGetSignedVAAWithRetry,
} from "@swim-io/wormhole";

import { SwimUiError } from "../../errors";
import { i18next } from "../../i18n";

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry =
  async (...args) => {
    const messageMapping: ReadonlyRecord<SwimErrorCode, string> = {
      [SwimWormholeErrorCode.GuardiansCannotConfirmTransfer]: i18next.t(
        "general.cannot_confirm_transfer_vaa_error",
      ),
      [SwimWormholeErrorCode.GuardiansCannotReach]: i18next.t(
        "general.unreachable_vaa_error",
      ),
      [SwimWormholeErrorCode.InternalError]: i18next.t(
        "general.internal_vaa_error",
      ),
    };

    return await originalGetSignedVAAWithRetry(...args).catch(
      (error: unknown) => {
        if (isSwimError(error)) {
          const message = messageMapping[error.code];
          if (message) throw new SwimUiError(message, error.cause);
        }

        throw error;
      },
    );
  };
