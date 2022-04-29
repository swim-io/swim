import {
  EuiCard,
  EuiFlexGrid,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { useTitle } from "../hooks";
import SKINNY_DIPPER from "../images/SKINNY_DIPPER.jpeg";
import SKINNY_DIPPER_OG from "../images/SKINNY_DIPPER_OG.jpeg";

// TODO: Page is currently inaccessible from UI buttons & add # in circulation.
const CollectiblesPage = (): ReactElement => {
  useTitle("Collectibles");
  return (
    <EuiPage className="collectiblesPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>Collectibles</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                <EuiCard
                  title="Skinny Dipper OG"
                  description="" // 500 in circulation"
                  image={<img src={SKINNY_DIPPER_OG} alt="Skinny Dipper OG" />}
                ></EuiCard>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  title="Skinny Dipper"
                  description="" // "1,000 in circulation"
                  image={<img src={SKINNY_DIPPER} alt="Skinny Dipper" />}
                ></EuiCard>
              </EuiFlexItem>
            </EuiFlexGrid>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default CollectiblesPage;
