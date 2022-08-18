import { i18next } from "../i18n";

import { extractSwimPoolError } from "./poolError";

export interface SolanaError extends Error {
  readonly logs?: readonly string[];
}

export const isSolanaError = (
  error: SolanaError | unknown,
): error is SolanaError => {
  return error instanceof Error && Object.hasOwnProperty.call(error, "logs");
};

export const extractSolanaErrorMessage = (error: SolanaError): string => {
  if (error.logs !== undefined) {
    for (const log of error.logs) {
      if (log.includes("could not be completed within the specified limits")) {
        return i18next.t(
          "solana_error.completed_with_the_specified_slippage_settings",
        );
      }

      if (log.includes("unknown signer:")) {
        return i18next.t("solana_error.unknown_signer");
      }

      if (log.includes("Error: insufficient funds")) {
        return i18next.t("solana_error.insufficient_funds");
      }

      const poolError = extractSwimPoolError(log);
      if (poolError) {
        return poolError;
      }

      // Fallback: Should come last
      if (log.includes("Program failed to complete")) {
        return log.replace("Program failed to complete: ", "Solana Error: ");
      }
    }
  }

  const errorString =
    typeof error === "object" ? JSON.stringify(error, null, 4) : String(error);
  const stringsToCheck = [error.message, errorString];

  if (stringsToCheck.some((str) => str.includes("Blockhash not found"))) {
    return i18next.t("solana_error.transaction_cannot_reach_chain", {
      errorMessage: errorString,
    });
  }
  if (stringsToCheck.some((str) => str.includes("insufficient funds"))) {
    return i18next.t("solana_error.insufficient_funds_with_additional_info", {
      errorMessage: errorString,
    });
  }

  return error.message || errorString;
};
