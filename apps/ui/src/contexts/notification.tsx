import type { EuiGlobalToastListToast } from "@elastic/eui";
import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactChild, ReactElement, ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type NotificationLevel = "info" | "success" | "warning" | "error";

const LEVEL_TO_COLOR = {
  info: "primary" as const,
  success: "success" as const,
  warning: "warning" as const,
  error: "danger" as const,
};

interface NotificationConfig {
  readonly toasts: readonly EuiGlobalToastListToast[];
  readonly addToast: (toast: EuiGlobalToastListToast) => void;
  readonly notify: (
    title: ReactChild,
    text?: ReactChild,
    level?: NotificationLevel,
    lifetime?: number,
  ) => void;
}

const NotificationContext = createContext<NotificationConfig>({
  toasts: [],
  addToast: () => {},
  notify: () => {},
});

export function NotificationProvider({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const initialToasts: readonly EuiGlobalToastListToast[] = [];
  const [toasts, setToasts] = useState(initialToasts);

  const addToast = (toast: EuiGlobalToastListToast): void => {
    setToasts([...toasts, toast]);
  };

  const removeToast = (removedToast: EuiGlobalToastListToast): void => {
    setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
  };

  const notify = (
    title: ReactChild,
    text: ReactChild = "",
    level: NotificationLevel = "info",
    lifetime = 15000,
  ): void => {
    const toast: EuiGlobalToastListToast = {
      id: `toast${Math.random()}`,
      title: title,
      text: text,
      color: LEVEL_TO_COLOR[level],
      toastLifeTimeMs: lifetime,
    };
    addToast(toast);
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        notify,
      }}
    >
      <EuiGlobalToastList
        toasts={[...toasts]}
        dismissToast={removeToast}
        toastLifeTimeMs={15000}
      />
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationConfig {
  return useContext(NotificationContext);
}
