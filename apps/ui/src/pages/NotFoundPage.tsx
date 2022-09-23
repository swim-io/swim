// TODO: Sync with lokalize to support multiple languages.

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

const NotFoundPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("not_found.title"));
  return (
    <EuiPage className="notFoundPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{t("not_found.header")}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>
                {t("not_found.body1")}
                <br />
                <br />
                <Trans
                  i18nKey="not_found.body2"
                  components={{
                    // eslint-disable-next-line jsx-a11y/anchor-has-content
                    a: <a href="https://swim.io/" />,
                  }}
                />
              </p>
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default NotFoundPage;
