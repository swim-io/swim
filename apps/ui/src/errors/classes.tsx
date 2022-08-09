import { EuiSpacer, EuiText } from "@elastic/eui";
import type { ReactElement } from "react";

import { i18next } from "../i18n";

import { extractErrorMessage } from "./parse";

export class MutationError extends Error {}

export class SwimError extends Error {
  userFriendlyMessage: string;
  originalError?: unknown;
  eventId?: string;

  /** Create a SwimError object able to store the original error and the eventId
   *
   * @param userFriendlyMessage User-facing error message. Can be empty string
   * @param originalError Root error object
   * @param eventId Sentry event ID
   */
  constructor(
    userFriendlyMessage: string,
    originalError?: unknown,
    eventId?: string,
  ) {
    super(originalError ? String(originalError) : userFriendlyMessage);
    this.name = this.constructor.name; // SwimError
    this.userFriendlyMessage = userFriendlyMessage;
    this.originalError = originalError;
    this.eventId = eventId;
  }

  toPrettyString(): string {
    let msg = "";

    if (this.userFriendlyMessage) {
      msg += `${this.userFriendlyMessage}:`;
    }
    if (this.originalError) {
      msg += extractErrorMessage(this.originalError);
    }
    if (this.eventId) {
      msg += ` (${this.eventId})`;
    }
    if (!msg) {
      msg = i18next.t("general.unknown_error");
    }
    return msg;
  }

  toPrettyJsx(): ReactElement {
    return (
      <>
        {this.userFriendlyMessage && (
          <span>
            {this.userFriendlyMessage}
            <EuiSpacer />
          </span>
        )}

        {this.originalError && (
          <code>{extractErrorMessage(this.originalError)}</code>
        )}

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

export class SolanaWalletError extends SwimError {
  constructor(
    userFriendlyMessage: string,
    originalError?: unknown,
    eventId?: string,
  ) {
    super(userFriendlyMessage, originalError, eventId);

    if (
      !this.userFriendlyMessage &&
      this.isSolanaWalletErrorData(originalError)
    ) {
      this.userFriendlyMessage = this.parseUserFriendlyMessage(originalError);
    }
  }

  isSolanaWalletErrorData(error: unknown): error is SolanaWalletErrorData {
    return (
      error instanceof Object &&
      typeof (error as SolanaWalletErrorData).code === "number" &&
      typeof (error as SolanaWalletErrorData).message === "string"
    );
  }

  parseUserFriendlyMessage(error: SolanaWalletErrorData): string {
    switch (error.code) {
      case 4001:
        return "User rejected the request. Please retry.";
      case 4100:
        return "The requested method and/or account has not been authorized by the user. This usually means your wallet locked itself. Unlock your wallet, refresh the page, and try again.";
    }
    return error.message;
  }
}
