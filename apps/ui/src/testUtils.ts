/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import type { ReactElement } from "react";

import { AppContext } from "./contexts";

export const mockOf = <T>(v: (...any: any) => T): jest.Mock<Partial<T>> =>
  v as unknown as jest.Mock<Partial<T>>;

export const renderHookWithAppContext: typeof renderHook = (
  callback,
  options = {},
) =>
  renderHook(callback, {
    ...options,
    wrapper: AppContext,
  });

export const rendeWithAppContext = (ui: ReactElement, options = {}) =>
  render(ui, {
    ...options,
    wrapper: AppContext,
  });
