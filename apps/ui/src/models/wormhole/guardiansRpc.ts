import type { ReadonlyRecord } from "@swim-io/utils";
import {
  WormholeError,
  WormholeErrorCode,
  getSignedVaaWithRetry as originalGetSignedVAAWithRetry,
} from "@swim-io/wormhole";

import { SwimError } from "../../errors";
import { i18next } from "../../i18n";

export const getSignedVaaWithRetry: typeof originalGetSignedVAAWithRetry =
  async (...args) => {
    const messageMapping: ReadonlyRecord<WormholeErrorCode, string> = {
      [WormholeErrorCode.GuardiansCannotConfirmTransfer]: i18next.t(
        "general.cannot_confirm_transfer_vaa_error",
      ),
      [WormholeErrorCode.GuardiansCannotReach]: i18next.t(
        "general.unreachable_vaa_error",
      ),
      [WormholeErrorCode.InternalError]: i18next.t(
        "general.internal_vaa_error",
      ),
    };

    return await originalGetSignedVAAWithRetry(...args).catch(
      (error: unknown) => {
        if (error instanceof WormholeError) {
          const message = messageMapping[error.code];
          if (message) throw new SwimError(message, error.originalError);
        }

        throw error;
      },
    );
  };
