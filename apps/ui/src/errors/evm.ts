interface EthErrorInternalData {
  readonly code: number;
  readonly message?: string;
}

/**
 * As returned by e.g. Metamask
 *
 * See also https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
 */
interface EthError {
  readonly code: number;
  readonly message: string;
  readonly data?: EthErrorInternalData; // unclear if optional
}

export const isEthError = (error: any): error is EthError => {
  if (error.code === undefined || typeof error.code !== "number") {
    return false;
  }

  if (error.code > -32999 && error.code < -32000) {
    return true; // Eth RPC error
  }

  if (error.code >= 4000 && error.code <= 5000) {
    return true; // Eth provider error
  }

  return false;
};

export const extractEthErrorMessage = (error: EthError): string => {
  // Internal JSON-RPC error
  if (error.code === -32603 && error.data?.message) {
    // We now handle this, so this should not happen anymore but just in case
    if (error.data.message.includes("transfer amount exceeds allowance")) {
      return "Transfer amount exceeds allowance. Please try again.";
    }

    if (error.data.message.includes("ExistentialDesposit")) {
      return "Exsistential deposit error. Your account does not have the required minimum balance of its native token to complete the swap.";
    }

    return error.data.message;
  }

  const errorString = error.message;

  if (errorString.includes("transfer already completed")) {
    return "Transfer already completed. Try refreshing the page.";
  }

  return errorString;
};
