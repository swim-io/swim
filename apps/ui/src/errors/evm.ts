import { i18next } from "../i18n";

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

export const isEthError = (error: unknown): error is EthError => {
  if (typeof error !== "object" || error === null) return false;

  const code = (error as Record<string, unknown>).code;

  if (typeof code !== "number") {
    return false;
  }

  if (code > -32999 && code < -32000) {
    return true; // Eth RPC error
  }

  if (code >= 4000 && code <= 5000) {
    return true; // Eth provider error
  }

  return false;
};

export const extractEthErrorMessage = (error: EthError): string => {
  // Internal JSON-RPC error
  if (error.code === -32603 && error.data?.message) {
    // We now handle this, so this should not happen anymore but just in case
    if (error.data.message.includes("transfer amount exceeds allowance")) {
      return i18next.t("evm_error.transfer_amount_exceeds_allowance");
    }

    if (error.data.message.includes("ExistentialDeposit")) {
      return i18next.t("evm_error.balance_not_enough_to_complete_swap");
    }

    return error.data.message;
  }

  const errorString = error.message;

  if (errorString.includes("transfer already completed")) {
    return i18next.t("evm_error.transfer_already_completed");
  }

  return errorString;
};
