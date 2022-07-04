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
        return "The instruction could not be completed with the specified slippage settings.";
      }

      if (log.includes("unknown signer:")) {
        return "Unknown signer. This is likely because you switched accounts in your wallet. Refresh the page and try again.";
      }

      if (log.includes("Error: insufficient funds")) {
        return "Insufficient funds";
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
    return `The transaction did not reach the Solana blockchain in time. This might be because you took too long to approve the transaction or because the network is congested. Additional info: ${errorString}`;
  }
  if (stringsToCheck.some((str) => str.includes("insufficient funds"))) {
    return `Insufficient funds. Additional info: ${errorString}`;
  }

  return error.message || errorString;
};
