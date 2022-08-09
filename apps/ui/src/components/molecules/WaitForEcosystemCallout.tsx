import { EuiCallOut, EuiSpacer } from "@elastic/eui";
import type React from "react";
import { useTranslation } from "react-i18next";

import { EcosystemId } from "../../config";

interface Props {
  readonly ecosystemId: EcosystemId;
}

export const WaitForEcosystemCallout: React.FC<Props> = ({ ecosystemId }) => {
  const { t } = useTranslation();
  if (ecosystemId === EcosystemId.Ethereum) {
    return (
      <>
        <EuiCallOut
          size="s"
          title={t("recent_interactions.ethereum_waiting_time")}
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
          title={t("recent_interactions.polygon_waiting_time")}
          iconType="clock"
        />
        <EuiSpacer size="s" />
      </>
    );
  }
  return null;
};
