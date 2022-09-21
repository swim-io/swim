import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { WormholeForm } from "../components/WormholeForm/WormholeForm";
import { useTitle } from "../hooks";

import "./WormholePage.scss";
import { useTranslation } from "react-i18next";

const WormholePage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.womrhole"));

  return (
    <EuiPage restrictWidth={580}>
      <EuiPageBody>
        <EuiPageContent horizontalPosition="center" verticalPosition="center">
          <EuiPageContentBody>
            <WormholeForm />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default WormholePage;
