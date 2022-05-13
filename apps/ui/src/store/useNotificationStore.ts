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

enum LEVEL_TO_COLOR {
  info = "primary",
  success = "success",
  warning = "warning",
  error = "danger",
}

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
  notify: (title, text = "", level = "info", lifetime) => {
    set(
      produce((state) => {
        state.toasts.push(createToast(title, text, level, lifetime));
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
