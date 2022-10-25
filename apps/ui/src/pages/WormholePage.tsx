import { EuiPage, EuiPageBody, EuiPageContent } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { WormholeForm } from "../components/WormholeForm";
import { useTitle } from "../hooks";

const WormholePage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.wormhole"));

  return (
    <EuiPage restrictWidth={620}>
      <EuiPageBody>
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
      </EuiPageBody>
    </EuiPage>
  );
};

export default WormholePage;
