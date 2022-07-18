import { EuiCallOut, EuiSpacer } from "@elastic/eui";
import type React from "react";

import type { EcosystemId } from "../../config";

interface Props {
  readonly ecosystemId: EcosystemId;
}

export const WaitForEcosystemCallout: React.FC<Props> = ({ ecosystemId }) => {
  if (ecosystemId === "ethereum") {
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
  // if (ecosystemId === POLYGON_ECOSYSTEM_ID) {
  //   return (
  //     <>
  //       <EuiCallOut
  //         size="s"
  //         title="Please note that waiting for Polygon block confirmations may take a long time. Finality requires 512 confirmations or about 18 minutes."
  //         iconType="clock"
  //       />
  //       <EuiSpacer size="s" />
  //     </>
  //   );
  // }
  return null;
};
