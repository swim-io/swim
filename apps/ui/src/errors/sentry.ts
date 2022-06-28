import * as Sentry from "@sentry/react";

// Benign error, probably safe to ignore. TODO: make sure these are actually ok
const IGNORE_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
];

const FINGERPRINT_PATTERNS = [
  /Transaction simulation failed: Error processing Instruction [0-9]+: /,
  /execution reverted: /,
];

export const setupSentry = (): void => {
  Sentry.init({
    dsn: "https://a3c69eb103bd4e3284be7403b7e6b5a1@o975678.ingest.sentry.io/5931913",
    integrations: [
      // We disable the default BrowserTracing because we set custom Swap/Add/Remove transaction types
      // new Integrations.BrowserTracing(),
    ],

    // Curimvent ad blockers
    // Tunnel Sentry requests via Cloudflare Worker
    tunnel: "https://cf-sentry-tunnel.swim-io.workers.dev/",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    beforeSend: beforeSend,

    autoSessionTracking: true, // default is true

    enabled: ["production", "preview"].includes(
      process.env.REACT_APP_ENV ?? "",
    ),

    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  });
};

const beforeSend = (
  event: Sentry.Event,
  hint: Sentry.EventHint | undefined,
): Sentry.Event | null => {
  // extract error message
  const error = hint?.originalException ?? null;
  const errorMessage = error instanceof Error ? error.message : error;

  // Ignore benign and known errors
  if (IGNORE_ERRORS.includes(event.message ?? "")) {
    return null;
  }

  // eslint-disable-next-line functional/immutable-data
  event.fingerprint = fixFingerprint(event.fingerprint, errorMessage ?? "");

  // Add fingerprint for ChunkLoadError
  if (
    event.exception?.values?.some((exception) =>
      exception.type?.includes("ChunkLoadError"),
    )
  ) {
    // eslint-disable-next-line functional/immutable-data
    event.fingerprint = ["ChunkLoadError"];
  }

  return event;
};

// Fix fingerprinting (By default Sentry bundles similar error message together)
// We overwrite the fingerprint with the exact error message
export const fixFingerprint = (
  // eslint-disable-next-line functional/prefer-readonly-type
  fingerprint: string[] | undefined,
  errorMessage: any,
  // eslint-disable-next-line functional/prefer-readonly-type
): string[] | undefined => {
  if (typeof errorMessage !== "string") {
    return fingerprint;
  }

  for (const pattern of FINGERPRINT_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return [errorMessage.replace(pattern, "")];
    }
  }

  return fingerprint;
};
