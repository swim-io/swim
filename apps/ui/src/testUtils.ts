/* eslint-disable @typescript-eslint/no-non-null-assertion */
// eslint-disable-next-line import/extensions
import { renderHook } from "@testing-library/react-hooks/dom";

import type { TokenSpec } from "./config";
import { Env, tokens } from "./config";
import { AppContext } from "./contexts";

export const mockOf = <T>(v: (...any: any) => T): jest.Mock<Partial<T>> =>
  v as unknown as jest.Mock<Partial<T>>;

export const findLocalnetTokenById = (tokenId: string): TokenSpec =>
  tokens[Env.Localnet].find(({ id }) => id === tokenId)!;

export const renderHookWithAppContext: typeof renderHook = (
  callback,
  options = {},
) =>
  renderHook(callback, {
    ...options,
    wrapper: AppContext,
  });
