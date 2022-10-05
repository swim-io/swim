import * as Sentry from "@sentry/react";
import type { Extras, SeverityLevel } from "@sentry/types";
import type { ReactElement } from "react";

import { SwimUiError } from "./classes";
import { extractErrorMessage } from "./parse";

/** Send an error to Sentry and log it to the console.
 *
 * @param error Any error object, incl. SwimUiError
 * @param context Optional context to send to Sentry
 * @returns unique event ID or null
 */
export const captureException = (
  error: unknown,
  context?: Extras,
): string | null => {
  if (error === null || error === undefined) {
    return null;
  }

  if (error instanceof SwimUiError && error.eventId) {
    Sentry.captureException("Trying to report an already reported error", {
      extra: { error: error },
    });
    return error.eventId;
  }

  const sentryError =
    error instanceof SwimUiError && error.cause
      ? error.cause
      : error instanceof Error
      ? error
      : new Error(extractErrorMessage(error));
  const sentryErrorMsg = String(sentryError);

  if (/User rejected the request/i.test(sentryErrorMsg)) {
    return null;
  }

  if (error instanceof Error && /blockhash not found/i.test(error.message)) {
    return null;
  }

  const eventId = Sentry.captureException(sentryError, { extra: context });

  console.error(
    error,
    eventId,
    error instanceof SwimUiError ? error.cause : null,
  );

  return eventId;
};

export const captureAndWrapException = (
  userErrorMessage: string,
  error: unknown,
  context?: Extras,
): SwimUiError => {
  const eventId = captureException(error, context);

  if (error instanceof SwimUiError) {
    if (eventId !== null) {
      // eslint-disable-next-line functional/immutable-data
      error.eventId = eventId;
    }
    return error;
  }

  return new SwimUiError(userErrorMessage, {
    cause: error,
    eventId: eventId ?? undefined,
  });
};

export const captureBreadcrumbError = (error: unknown): void => {
  console.error(error);
  const level: SeverityLevel = "error";
  Sentry.addBreadcrumb({
    category: "handledError",
    message: JSON.stringify(error),
    level,
  });
};

export const formatErrorJsx = (error: unknown): ReactElement => {
  if (error instanceof SwimUiError) {
    return error.toPrettyJsx();
  }

  return <>{extractErrorMessage(error)}</>;
};
