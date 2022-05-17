import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactElement } from "react";

import { selectRemoveToast, selectToasts } from "../core/selectors";
import { useNotification } from "../core/store";

const Notification = (): ReactElement => {
  const toasts = useNotification(selectToasts);
  const removeToast = useNotification(selectRemoveToast);

  return (
    <EuiGlobalToastList
      toasts={[...toasts]}
      dismissToast={toasts.length ? removeToast : () => null}
      toastLifeTimeMs={10000}
    />
  );
};

export default Notification;
