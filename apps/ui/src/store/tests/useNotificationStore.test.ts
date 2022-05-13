import type { EuiGlobalToastListToast } from "@elastic/eui";
import { cleanup } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";

import { useNotificationStore } from "../useNotificationStore";

describe("useNotificationStore", () => {
  afterEach(() => {
    // You can choose to set the store's state to a default value here.
    jest.resetAllMocks();
    cleanup();
  });
  it("initially returns empty toast array", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    expect(result.current.toasts).toEqual([]);
  });
  it("returns new toast from store", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    const toast: EuiGlobalToastListToast = {
      id: "toast",
      title: "Error",
      text: "Some error",
      color: "warning",
      toastLifeTimeMs: 10000,
    };
    act(() => {
      result.current.notify("Error", "Some error", "warning");
    });

    // expect(result.current.toasts[0]).toEqual(toast);
    expect(result.current.toasts[0].id).toContain(toast.id);
    expect(result.current.toasts[0].title).toEqual(toast.title);
    expect(result.current.toasts[0].text).toEqual(toast.text);
    expect(result.current.toasts[0].color).toEqual(toast.color);
    expect(result.current.toasts[0].toastLifeTimeMs).toEqual(
      toast.toastLifeTimeMs,
    );
  });
  it("removes created toast from store", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    const toast: EuiGlobalToastListToast = result.current.toasts[0];

    act(() => {
      result.current.removeToast(result.current.toasts[0]);
    });
    expect(result.current.toasts.some((t) => t.id === toast.id)).toBe(false);
  });
});
