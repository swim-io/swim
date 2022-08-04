import type { EuiGlobalToastListToast } from "@elastic/eui";
import type { Draft } from "immer";
import { produce } from "immer";
import type { ReactChild } from "react";
import create from "zustand";

type NotificationLevel = "info" | "success" | "warning" | "error";
type Toast = Draft<EuiGlobalToastListToast>;

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
): Toast => ({
  id: `toast${Math.random()}`,
  title: title,
  text: text,
  color: LEVEL_TO_COLOR[level],
  toastLifeTimeMs: lifetime,
});

export const useNotification = create<NotificationState>((set) => ({
  toasts: [],
  notify: (title, text = "", level = "info", lifetime) => {
    set(
      produce<NotificationState>((draft) => {
        const newToast = createToast(title, text, level, lifetime);
        draft.toasts.push(newToast);
      }),
    );
  },
  removeToast: (removedToast: EuiGlobalToastListToast) => {
    set(
      produce<NotificationState>((draft) => {
        draft.toasts = draft.toasts.filter(
          (toast: EuiGlobalToastListToast) => toast.id !== removedToast.id,
        );
      }),
    );
  },
}));
