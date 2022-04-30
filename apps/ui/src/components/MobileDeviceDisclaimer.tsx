import { EuiCallOut } from "@elastic/eui";
import type { ReactElement } from "react";

export const MobileDeviceDisclaimer = (): ReactElement => {
  return (
    <EuiCallOut
      title="Mobile device detected"
      color="warning"
      iconType="mobile"
    >
      While most features should work, please note that we optimized the
      cross-chain experience for desktop devices.
    </EuiCallOut>
  );
};
