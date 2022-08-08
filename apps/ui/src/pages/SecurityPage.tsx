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

const SecurityPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("security_page.title"));
  return (
    <EuiPage className="securityPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{t("security_page.title")}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>{t("security_page.encourage_the_community_to_participate")}</p>
              <p>
                {t("security_page.how_to_report_security_vulnerability", {
                  email: "admin@swim.io",
                })}
              </p>

              <p>
                <a href="/pgp-key.txt">{t("security_page.download_pgp_key")}</a>
              </p>

              <p>
                <Trans
                  i18nKey="security_page.report_via_immunefi"
                  components={{
                    // eslint-disable-next-line jsx-a11y/anchor-has-content
                    a: <a href="https://immunefi.com/bounty/swimprotocol/" />,
                  }}
                />
              </p>

              <h3>{t("security_page.responsible_disclosure_guidelines")}</h3>
              <p>
                <span>
                  {t(
                    "security_page.responsible_disclosure_guidelines_introduction",
                  )}
                </span>
                <ul>
                  <li>
                    {t("security_page.responsible_disclosure_guideline1")}
                  </li>
                  <li>
                    {t("security_page.responsible_disclosure_guideline2")}
                  </li>
                  <li>
                    {t("security_page.responsible_disclosure_guideline3")}
                  </li>
                  <li>
                    {t("security_page.responsible_disclosure_guideline4")}
                  </li>
                </ul>
              </p>
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SecurityPage;
