import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useTitle } from "../hooks";

const TosPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.terms_of_service"));
  return (
    <EuiPage className="tosPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{t("nav.terms_of_service")}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText style={{ whiteSpace: "pre-line" }}>
              {t("tos_page.terms")}
            </EuiText>
            <EuiText>
              <br />
              <Trans
                i18nKey="tos_page.contact_us"
                values={{ email: "info@swim.io" }}
                components={{
                  // eslint-disable-next-line jsx-a11y/anchor-has-content
                  a: <a href="mailto:info@swim.io" />,
                }}
              />
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default TosPage;
