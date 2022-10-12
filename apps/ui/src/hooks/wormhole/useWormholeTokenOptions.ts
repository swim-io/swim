import { useMemo } from "react";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useWormholeFromTokenOptionsIds = () => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  return useMemo(
    () =>
      tokens
        .filter((token) => token.wrappedDetails.size > 0)
        .map((token) => token.id),
    [tokens],
  );
};
