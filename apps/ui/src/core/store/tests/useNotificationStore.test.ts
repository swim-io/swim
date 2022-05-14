import type { EuiGlobalToastListToast } from "@elastic/eui";
import { cleanup } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";

import { useNotificationStore } from "..";

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
      id: expect.stringMatching(/^toast0\.\d+$/),
      title: "Error",
      text: "Some error",
      color: "warning",
      toastLifeTimeMs: 10000,
    };
    act(() => {
      result.current.notify("Error", "Some error", "warning");
    });

    expect(result.current.toasts[0]).toEqual(toast);
    expect(result.current.toasts).toEqual([toast]);
  });
  it("removes created toast from store", async () => {
    const { result } = renderHook(() => useNotificationStore((state) => state));
    act(() => {
      result.current.notify("Notification1", "First notification", "success");
      result.current.notify("Notification2", "Second notifications", "warning");
      result.current.notify("Notification3", "Third notifications", "info");
    });
    const toast: EuiGlobalToastListToast = result.current.toasts[2];

    act(() => {
      result.current.removeToast(result.current.toasts[2]);
    });
    expect(result.current.toasts.some((t) => t.id === toast.id)).toBe(false);
  });
});
