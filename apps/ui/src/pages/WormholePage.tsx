import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { WormholeForm } from "components/WormholeForm";
import { useTitle } from "../hooks";

import "./WormholePage.scss";

const WormholePage = (): ReactElement => {
  useTitle("Wormhole");

  return (
    <EuiPage restrictWidth={800}>
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
