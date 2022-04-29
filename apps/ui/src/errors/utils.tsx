import * as Sentry from "@sentry/react";
import type { ReactElement } from "react";

import { SwimError } from "./classes";
import { extractErrorMessage } from "./parse";

/** Send an error to Sentry and log it to the console.
 *
 * @param error Any error object, incl. SwimError
 * @param context Optional context to send to Sentry
 * @returns unique event ID or null
 */
export const captureException = (
  error: unknown,
  context?: any,
): string | null => {
  if (error === null || error === undefined) {
    return null;
  }

  if (error instanceof SwimError && error.eventId) {
    Sentry.captureException("Trying to report an already reported error", {
      extra: { error: error },
    });
    return error.eventId;
  }

  const sentryError =
    error instanceof SwimError && error.originalError
      ? error.originalError
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
    error instanceof SwimError ? error.originalError : null,
  );

  return eventId;
};

export const captureAndWrapException = (
  userErrorMessage: string,
  error: unknown,
  context?: any,
): SwimError => {
  const eventId = captureException(error, context);

  if (error instanceof SwimError) {
    if (eventId !== null) {
      // eslint-disable-next-line functional/immutable-data
      error.eventId = eventId;
    }
    return error;
  }

  return new SwimError(userErrorMessage, error, eventId ?? undefined);
};

export const captureBreadcrumbError = (error: unknown): void => {
  console.error(error);
  Sentry.addBreadcrumb({
    category: "handledError",
    message: JSON.stringify(error),
    level: Sentry.Severity.Error,
  });
};

export const formatErrorJsx = (error: unknown): ReactElement => {
  if (error instanceof SwimError) {
    return error.toPrettyJsx();
  }

  return <>{extractErrorMessage(error)}</>;
};
