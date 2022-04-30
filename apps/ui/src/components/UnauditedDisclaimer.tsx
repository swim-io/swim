import { EuiCallOut } from "@elastic/eui";
import type { ReactElement } from "react";

export const UnauditedDisclaimer = (): ReactElement => {
  return (
    <EuiCallOut title="Proceed with caution" color="warning" iconType="alert">
      This is an alpha release. Use at your own risk.
    </EuiCallOut>
  );
};
