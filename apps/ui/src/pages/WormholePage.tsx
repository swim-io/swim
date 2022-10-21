import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
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
    <EuiPage restrictWidth={600}>
      <EuiPageBody>
        <EuiPageContentBody>
          <EuiPageContent
            horizontalPosition="center"
            verticalPosition="center"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <WormholeForm />
          </EuiPageContent>
        </EuiPageContentBody>
      </EuiPageBody>
    </EuiPage>
  );
};

export default WormholePage;
