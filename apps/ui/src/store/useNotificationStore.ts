import type { EuiGlobalToastListToast } from "@elastic/eui";
import produce from "immer";
import type { ReactChild } from "react";
import create from "zustand";

type NotificationLevel = "info" | "success" | "warning" | "error";

export interface NotificationState {
  readonly toasts: readonly EuiGlobalToastListToast[];
  readonly removeToast: (toast: EuiGlobalToastListToast) => void;
  readonly notify: (
    title: ReactChild,
    text?: ReactChild,
    level?: NotificationLevel,
    lifetime?: number,
  ) => void;
}

const LEVEL_TO_COLOR = {
  info: "primary" as const,
  success: "success" as const,
  warning: "warning" as const,
  error: "danger" as const,
};

const createToast = (
  title: ReactChild,
  text: ReactChild = "",
  level: NotificationLevel = "info",
  lifetime = 10000,
): EuiGlobalToastListToast => ({
  id: `toast${Math.random()}`,
  title: title,
  text: text,
  color: LEVEL_TO_COLOR[level],
  toastLifeTimeMs: lifetime,
});

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  notify: (
    title: ReactChild,
    text: ReactChild = "",
    color: NotificationLevel = "info",
  ) => {
    set(
      produce((state) => {
        state.toasts.push(createToast(title, text, color));
      }),
    );
  },
  removeToast: (removedToast: EuiGlobalToastListToast) => {
    set(
      produce((state) => {
        const updatedToasts = state.toasts.filter(
          (toast: EuiGlobalToastListToast) => toast.id !== removedToast.id,
        );
        return { ...state, toasts: updatedToasts };
      }),
    );
  },
}));
