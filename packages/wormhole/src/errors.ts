import type { SwimErrorMapping, SwimErrorOptions } from "@swim-io/core";
import { SwimError } from "@swim-io/core";
import type { ReadonlyRecord, ValueOf } from "@swim-io/utils";
import { assertType } from "@swim-io/utils";

export enum SwimWormholeErrorCode {
  GuardiansCannotConfirmTransfer = "@swim-io/wormhole/GuardiansCannotConfirmTransfer",
  GuardiansCannotReach = "@swim-io/wormhole/GuardiansCannotReach",
  InternalError = "@swim-io/wormhole/InternalError",
}
// Check if all error codes have current package name as prefix
assertType<ReadonlyRecord<string, `@swim-io/wormhole/${string}`>>()(
  SwimWormholeErrorCode,
);

const errorMessageMapping: SwimErrorMapping<SwimWormholeErrorCode> = {
  [SwimWormholeErrorCode.GuardiansCannotConfirmTransfer]: {
    message:
      "Could not confirm transfer with Wormhole guardians. This usually happens when the source blockchain is congested. Please try again later.",
    isRetryable: true,
  },
  [SwimWormholeErrorCode.GuardiansCannotReach]: {
    message: "Unable to reach the Wormhole guardians. Please try again later.",
    isRetryable: true,
  },
  [SwimWormholeErrorCode.InternalError]: {
    message: "Something went wrong.",
    isRetryable: false,
  },
};

export class SwimWormholeError extends SwimError<SwimWormholeErrorCode> {
  public constructor(
    options: Omit<
      SwimErrorOptions<SwimWormholeErrorCode>,
      keyof ValueOf<SwimErrorMapping<SwimWormholeErrorCode>>
    >,
  ) {
    const { message, ...restOptions } = errorMessageMapping[options.code];
    super(message, {
      ...options,
      ...restOptions,
    });
  }
}
