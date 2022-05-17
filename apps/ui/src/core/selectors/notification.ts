import type { NotificationState } from "../store";

export const selectNotify = (state: NotificationState) => state.notify;
export const selectToasts = (state: NotificationState) => state.toasts;
export const selectRemoveToast = (state: NotificationState) =>
  state.removeToast;
