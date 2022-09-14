import { EuiCallOut, EuiText } from "@elastic/eui";
import type { ReactElement } from "react";

export const EthereumMergeWarning = (): ReactElement => (
  <>
    <EuiCallOut title={"Ethereum Merge"} color="warning">
      <EuiText>
        <p>
          {
            "Please note that as a precaution we have temporarily disabled our pools while the Ethereum merge takes place."
          }
        </p>
      </EuiText>
    </EuiCallOut>
  </>
);
