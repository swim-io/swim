import { EuiCallOut } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export const MobileDeviceDisclaimer = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <EuiCallOut
      title={t("general.mobile_device_disclaimer_title")}
      color="warning"
      iconType="mobile"
    >
      {t("general.mobile_device_disclaimer_description")}
    </EuiCallOut>
  );
};
