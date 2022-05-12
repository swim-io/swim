import { cleanup } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";

import { useNotificationStore } from "../useNotificationStore";

describe("useNotificationStore", () => {
  afterEach(() => {
    // You can chose to set the store's state to a default value here.
    jest.resetAllMocks();
    cleanup();
  });
  it("initially returns empty toast array", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    expect(result.current.toasts).toEqual([]);
  });
  it("returns new toast from store", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    const toast = {
      title: "Error",
      text: "Some error",
      color: "warning",
      toastLifeTimeMs: 10000,
    };
    act(() => {
      result.current.notify("Error", "Some error", "warning");
    });

    expect(result.current.toasts[0].title).toEqual(toast.title);
    expect(result.current.toasts[0].text).toEqual(toast.text);
    expect(result.current.toasts[0].color).toEqual(toast.color);
  });
  it("removes created toast from store", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    expect(result.current.toasts.length).toEqual(1);
    act(() => {
      result.current.removeToast(result.current.toasts[0]);
    });
    expect(result.current.toasts.length).toEqual(0);
  });
});
