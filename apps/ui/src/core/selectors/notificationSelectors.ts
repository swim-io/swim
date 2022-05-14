import type { NotificationState } from "../store";

export const notify = (state: NotificationState) => state.notify;
export const toasts = (state: NotificationState) => state.toasts;
export const removeToast = (state: NotificationState) => state.removeToast;
