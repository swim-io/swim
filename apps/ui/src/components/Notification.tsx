import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactElement } from "react";

import { useNotification } from "../core/store";

const Notification = (): ReactElement => {
  const { toasts, removeToast } = useNotification();

  return (
    <EuiGlobalToastList
      toasts={[...toasts]}
      dismissToast={toasts.length ? removeToast : () => null}
      toastLifeTimeMs={10000}
    />
  );
};

export default Notification;
