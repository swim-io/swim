import type { ParsedTransactionWithMeta } from "@solana/web3.js";

const PROPELLER_OUTPUT_AMOUNT_REGEX =
  /^Program log: propeller_add output_amount: (?<amount>\d+)/;
export const extractOutputAmountFromAddTx = (
  tx: ParsedTransactionWithMeta | null,
): string | null => {
  const addLog = tx?.meta?.logMessages?.find((log) =>
    PROPELLER_OUTPUT_AMOUNT_REGEX.test(log),
  );
  return addLog?.match(PROPELLER_OUTPUT_AMOUNT_REGEX)?.groups?.amount ?? null;
};
