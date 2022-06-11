import { EuiCallOut, EuiSpacer } from "@elastic/eui";
import type React from "react";

import { EcosystemId } from "../../config";

interface Props {
  readonly ecosystemId: EcosystemId;
}

export const WaitForEcosystemCallout: React.FC<Props> = ({ ecosystemId }) => {
  if (ecosystemId === EcosystemId.Ethereum) {
    return (
      <>
        <EuiCallOut
          size="s"
          title="Please note that waiting for Ethereum block confirmations may take a few minutes."
          iconType="clock"
        />
        <EuiSpacer size="s" />
      </>
    );
  }
  if (ecosystemId === EcosystemId.Polygon) {
    return (
      <>
        <EuiCallOut
          size="s"
          title="Please note that waiting for Polygon block confirmations may take a long time. Finality requires 512 confirmations or about 18 minutes."
          iconType="clock"
        />
        <EuiSpacer size="s" />
      </>
    );
  }
  return null;
};
