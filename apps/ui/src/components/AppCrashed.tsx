import { EuiButton, EuiEmptyPrompt, EuiPage, EuiPageBody } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export const AppCrashed = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiEmptyPrompt
          color="danger"
          iconType="alert"
          title={<h2>{t("app_crashed.title")}</h2>}
          body={t("app_crashed.description")}
          actions={
            <EuiButton onClick={() => window.location.reload()} fill>
              {t("general.reload_page")}
            </EuiButton>
          }
        />
      </EuiPageBody>
    </EuiPage>
  );
};

export const NewVersionAlert = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <EuiEmptyPrompt
          color="primary"
          iconType="refresh"
          title={<h2>{t("new_version_alert.title")}</h2>}
          body={t("new_version_alert.description")}
          actions={
            <EuiButton onClick={() => window.location.reload()} fill>
              {t("general.reload_page")}
            </EuiButton>
          }
        />
      </EuiPageBody>
    </EuiPage>
  );
};
