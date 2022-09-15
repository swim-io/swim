import { EuiCallOut, EuiSpacer } from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import type React from "react";
import { useTranslation } from "react-i18next";

import type { EcosystemId } from "../../../config";

interface Props {
  readonly ecosystemId: EcosystemId;
}

export const WaitForEcosystemCallout: React.FC<Props> = ({ ecosystemId }) => {
  const { t } = useTranslation();
  if (ecosystemId === EvmEcosystemId.Ethereum) {
    return (
      <>
        <EuiCallOut
          size="s"
          title={t("recent_interactions.ethereum_waiting_time", {
            confirmations: 95,
            minutes: 19,
          })}
          iconType="clock"
        />
        <EuiSpacer size="s" />
      </>
    );
  }
  if (ecosystemId === EvmEcosystemId.Polygon) {
    return (
      <>
        <EuiCallOut
          size="s"
          title={t("recent_interactions.polygon_waiting_time", {
            confirmations: 512,
            minutes: 18,
          })}
          iconType="clock"
        />
        <EuiSpacer size="s" />
      </>
    );
  }
  return null;
};
