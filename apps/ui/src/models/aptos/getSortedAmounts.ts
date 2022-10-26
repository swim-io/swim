import { isSortedSymbols } from "@swim-io/aptos";

import type { Amount } from "../amount";

export const getSortedAmounts = (
  amounts: readonly [Amount, Amount],
): readonly [Amount, Amount] => {
  const isSorted = isSortedSymbols(
    amounts[0].tokenConfig.nativeDetails.address,
    amounts[1].tokenConfig.nativeDetails.address,
  );

  const reversed = [...amounts].reverse();

  return isSorted ? amounts : [reversed[0], reversed[1]];
};
