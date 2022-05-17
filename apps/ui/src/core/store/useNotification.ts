/* eslint-disable functional/immutable-data */
import type { EuiGlobalToastListToast } from "@elastic/eui";
import type { Draft } from "immer";
import { produce } from "immer";
import type { ReactChild } from "react";
import type { SetState } from "zustand";
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

export const useNotification = create<NotificationState>(
  (set: SetState<any>) => ({
    toasts: [],
    notify: (title, text = "", level = "info", lifetime) => {
      set((state: NotificationState) =>
        produce<NotificationState>(state, (draft) => {
          const newToast = createToast(
            title,
            text,
            level,
            lifetime,
          ) as Draft<EuiGlobalToastListToast>;
          draft.toasts.push(newToast);
        }),
      );
    },
    removeToast: (removedToast: EuiGlobalToastListToast) => {
      set((state: NotificationState) =>
        produce<NotificationState>(state, (draft) => {
          draft.toasts = draft.toasts.filter(
            (toast: EuiGlobalToastListToast) => toast.id !== removedToast.id,
          );
        }),
      );
    },
  }),
);
