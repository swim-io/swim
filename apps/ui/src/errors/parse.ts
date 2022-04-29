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
      return "Transfer not detected by Wormhole guardians. This usually happens when the network is congested. Please retry later.";
    }
    return error.message;
  }

  return String(error);
};
