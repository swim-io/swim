import { EuiPage, EuiPageContent, EuiPageContentBody } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { WormholeForm } from "../components/WormholeForm/WormholeForm";
import { useTitle } from "../hooks";

import "./WormholePage.scss";

const WormholePage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.womrhole"));

  return (
    <EuiPage restrictWidth={600}>
      <EuiPageContent horizontalPosition="center" verticalPosition="center">
        <EuiPageContentBody>
          <WormholeForm />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPage>
  );
};

export default WormholePage;
