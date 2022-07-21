/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import type { ReactElement } from "react";

import { AppContext } from "./contexts";

// eslint-disable-next-line functional/prefer-readonly-type
export const mockOf = <T, Y extends any[]>(
  v: (...args: Y) => T,
): jest.Mock<Partial<T>, Y> => v as unknown as jest.Mock<Partial<T>, Y>;

export const renderHookWithAppContext: typeof renderHook = (
  callback,
  options = {},
) =>
  renderHook(callback, {
    ...options,
    wrapper: AppContext,
  });

export const renderWithAppContext = (ui: ReactElement, options = {}) =>
  render(ui, {
    ...options,
    wrapper: AppContext,
  });
