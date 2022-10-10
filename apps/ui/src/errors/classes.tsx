import { EuiSpacer, EuiText } from "@elastic/eui";
import { ErrorWithCause } from "@swim-io/core";
import type { ReactElement } from "react";

import { i18next } from "../i18n";

import { extractErrorMessage } from "./parse";

export class MutationError extends Error {}

type SwimUiErrorOptions = ErrorOptions & {
  readonly eventId?: string;
};
export class SwimUiError extends ErrorWithCause {
  public userFriendlyMessage: string;
  public eventId?: string;

  /** Create a SwimUiError object able to store the original error and the eventId
   *
   * @param userFriendlyMessage User-facing error message. Can be empty string
   * @param cause Root error object
   * @param eventId Sentry event ID
   */
  public constructor(
    userFriendlyMessage: string,
    { eventId, ...options }: SwimUiErrorOptions = {},
  ) {
    super(options.cause ? String(options.cause) : userFriendlyMessage, options);
    this.name = this.constructor.name; // SwimUiError
    this.userFriendlyMessage = userFriendlyMessage;
    this.eventId = eventId;
  }

  public toPrettyString(): string {
    let msg = "";

    if (this.userFriendlyMessage) {
      msg += `${this.userFriendlyMessage}:`;
    }
    if (this.cause) {
      msg += extractErrorMessage(this.cause);
    }
    if (this.eventId) {
      msg += ` (${this.eventId})`;
    }
    if (!msg) {
      msg = i18next.t("general.unknown_error");
    }
    return msg;
  }

  public toPrettyJsx(): ReactElement {
    return (
      <>
        {this.userFriendlyMessage && (
          <span>
            {this.userFriendlyMessage}
            <EuiSpacer />
          </span>
        )}

        {this.cause && <code>{extractErrorMessage(this.cause)}</code>}

        {this.eventId && (
          <EuiText size="s" color="subdued">
            <EuiSpacer />
            {i18next.t("general.error_code", { errorCode: this.eventId })}
          </EuiText>
        )}
      </>
    );
  }
}

// See also https://docs.phantom.app/integrating/errors
interface SolanaWalletErrorData {
  readonly code: number;
  readonly message: string;
}

export class SolanaWalletError extends SwimUiError {
  public constructor(
    userFriendlyMessage: string,
    options: SwimUiErrorOptions = {},
  ) {
    super(userFriendlyMessage, options);

    if (
      !this.userFriendlyMessage &&
      this.isSolanaWalletErrorData(options.cause)
    ) {
      this.userFriendlyMessage = this.parseUserFriendlyMessage(options.cause);
    }
  }

  private isSolanaWalletErrorData(
    error: unknown,
  ): error is SolanaWalletErrorData {
    return (
      error instanceof Object &&
      typeof (error as SolanaWalletErrorData).code === "number" &&
      typeof (error as SolanaWalletErrorData).message === "string"
    );
  }

  private parseUserFriendlyMessage(error: SolanaWalletErrorData): string {
    switch (error.code) {
      case 4001:
        return "User rejected the request. Please retry.";
      case 4100:
        return "The requested method and/or account has not been authorized by the user. This usually means your wallet locked itself. Unlock your wallet, refresh the page, and try again.";
    }
    return error.message;
  }
}
