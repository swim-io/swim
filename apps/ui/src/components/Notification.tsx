import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactElement } from "react";

import { removeToast, toasts } from "../core/selectors";
import { useNotificationStore } from "../core/store";

const Notification = (): ReactElement => {
  const allToasts = useNotificationStore(toasts);
  const deleteToast = useNotificationStore(removeToast);

  return (
    <EuiGlobalToastList
      toasts={[...allToasts]}
      dismissToast={allToasts.length ? deleteToast : () => null}
      toastLifeTimeMs={10000}
    />
  );
};

export default Notification;
