import { act, renderHook } from "@testing-library/react-hooks";
import { useState } from "react";

import { usePrevious } from "./usePrevious";

describe("usePrevious", () => {
  it("should return previous value for setState hook", () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const previousCount = usePrevious(count);
      return { count, setCount, previousCount };
    });

    expect(result.current.count).toBe(0);
    expect(result.current.previousCount).toBe(undefined);

    act(() => {
      result.current.setCount((count) => count + 1);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.previousCount).toBe(0);
  });

  it("should return undefined | string value", () => {
    const { result } = renderHook(() => {
      const [name, setName] = useState<undefined | string>(undefined);
      const previousCount = usePrevious(name);
      return { name, setName, previousCount };
    });

    expect(result.current.name).toBe(undefined);
    expect(result.current.previousCount).toBe(undefined);

    act(() => {
      result.current.setName("swim");
    });

    expect(result.current.name).toBe("swim");
    expect(result.current.previousCount).toBe(undefined);
  });
});
