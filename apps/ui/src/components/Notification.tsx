import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactElement } from "react";

import { useNotificationStore } from "../store/useNotificationStore";

const Notification = (): ReactElement => {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  return (
    <EuiGlobalToastList
      toasts={[...toasts]}
      dismissToast={toasts.length ? removeToast : () => null}
      toastLifeTimeMs={10000}
    />
  );
};

export default Notification;
