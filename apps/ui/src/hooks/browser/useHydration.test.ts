import { renderHook } from "@testing-library/react-hooks";

import { useEnvironment } from "../../core/store";

import { useHydration } from "./useHydration";

describe("useHydration", () => {
  it("should return hasHydrated from persisted environment store", () => {
    const { result } = renderHook(() => useHydration());
    const hasHydrated = useEnvironment.persist.hasHydrated();
    expect(result.current).toEqual(hasHydrated);
  });
});
