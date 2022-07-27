import { findOrThrow } from "@swim-io/utils";
import { useMemo } from "react";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useToken = (tokenId: string) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  return useMemo(
    () => findOrThrow(tokens, ({ id }) => id === tokenId),
    [tokenId, tokens],
  );
};
