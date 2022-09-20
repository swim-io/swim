import { useMemo } from "react";
import shallow from "zustand/shallow.js";

import { isSwimUsd } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useSwimUsd = () => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  return useMemo(() => tokens.find(isSwimUsd) ?? null, [tokens]);
};
