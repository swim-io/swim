import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { WormholeForm } from "../components/WormholeForm";
import { useTitle } from "../hooks";

import "./WormholePage.scss";

const WormholePage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.wormhole"));

  return (
    <EuiPage restrictWidth={620}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{"Wormhole"}</h2>
            </EuiTitle>
            <EuiSpacer />
            <WormholeForm />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default WormholePage;
