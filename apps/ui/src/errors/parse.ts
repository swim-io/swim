import { i18next } from "../i18n";

import { extractEthErrorMessage, isEthError } from "./evm";
import { extractSolanaErrorMessage, isSolanaError } from "./solana";

export const extractErrorMessage = (error: unknown): string => {
  if (isSolanaError(error)) {
    return extractSolanaErrorMessage(error);
  }

  if (isEthError(error)) {
    return extractEthErrorMessage(error);
  }

  if (error instanceof Error) {
    if (/requested VAA not found in store/i.test(error.message)) {
      return i18next.t("vaa_error.transfer_not_detected");
    }
    return error.message;
  }

  return String(error);
};
