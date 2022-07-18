import { findOrThrow } from "../../utils";
import type { EnvironmentState } from "../store";

import { selectConfig } from "./environment";

export const selectTokenSpec =
  (tokenId: string) => (state: EnvironmentState) => {
    const { tokens } = selectConfig(state);
    return findOrThrow(tokens, (token) => token.id === tokenId);
  };
