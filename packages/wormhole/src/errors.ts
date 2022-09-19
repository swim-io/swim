import type { ReadonlyRecord } from "@swim-io/utils";

export enum WormholeErrorCode {
  GuardiansCannotConfirmTransfer,
  GuardiansCannotReach,
  InternalError,
}

const wormholeErrorMessageMapping: ReadonlyRecord<WormholeErrorCode, string> = {
  [WormholeErrorCode.GuardiansCannotConfirmTransfer]:
    "Could not confirm transfer with Wormhole guardians. This usually happens when the source blockchain is congested. Please try again later.",
  [WormholeErrorCode.GuardiansCannotReach]:
    "Unable to reach the Wormhole guardians. Please try again later.",
  [WormholeErrorCode.InternalError]: "Something went wrong.",
};

export class WormholeError extends Error {
  public readonly code: WormholeErrorCode;
  public readonly originalError?: unknown;

  public constructor(code: WormholeErrorCode, originalError?: unknown) {
    super(wormholeErrorMessageMapping[code]);
    this.code = code;
    this.originalError = originalError;
  }
}
