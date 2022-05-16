import { EuiGlobalToastList } from "@elastic/eui";
import type { ReactElement } from "react";

import { selectRemoveToast, selectToasts } from "../core/selectors";
import { useNotificationStore } from "../core/store";

const Notification = (): ReactElement => {
  const allToasts = useNotificationStore(selectToasts);
  const deleteToast = useNotificationStore(selectRemoveToast);

  return (
    <EuiGlobalToastList
      toasts={[...allToasts]}
      dismissToast={allToasts.length ? deleteToast : () => null}
      toastLifeTimeMs={10000}
    />
  );
};

export default Notification;
