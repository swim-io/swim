import { EuiButton, EuiCallOut, EuiPanel } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export const PoolPausedAlert = ({
  isVisible,
}: {
  readonly isVisible: boolean;
}): ReactElement => {
  const { t } = useTranslation();
  if (!isVisible) {
    return <></>;
  }

  return (
    <EuiPanel hasShadow={false} style={{ paddingLeft: 0, paddingRight: 0 }}>
      <EuiCallOut
        title={t("pool_paused_alert.title")}
        color="danger"
        iconType="alert"
      >
        <p>{t("pool_paused_alert.description")}</p>
        <EuiButton
          href="/help"
          onClick={(e) => {
            e.preventDefault();
            window.open("/help", "_blank");
          }}
          color="warning"
          iconType="popout"
          iconSide="right"
          size="s"
        >
          {t("general.get_help_button")}
        </EuiButton>
      </EuiCallOut>
    </EuiPanel>
  );
};
