import {
  EuiButton,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from "@elastic/eui";
import type { ReactElement } from "react";

import {
  AlternatingFeaturettes,
  NftFaqAccordians,
} from "../components/OtterTotsLandingPageComponents";
import { useTitle } from "../hooks";

const OtterTotsPage = (): ReactElement => {
  const collectionName = "Otter Tots";
  useTitle(collectionName);

  return (
    <EuiPage className="OtterTots" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiFlexGroup
              justifyContent="spaceBetween"
              responsive={false}
              direction="column"
              alignItems="center"
            >
              <EuiFlexItem>
                <EuiTitle>
                  <h2>{collectionName}</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiImage
                  src="https://www.degendojonft.com/assets/images/about/about-img.gif"
                  alt=""
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText grow={false}>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                    occaecat cupidatat non proident, sunt in culpa qui officia
                    deserunt mollit anim id est laborum.
                  </p>
                </EuiText>
                <EuiSpacer />
                <EuiSpacer />
              </EuiFlexItem>
            </EuiFlexGroup>
            {AlternatingFeaturettes()}
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                {/* TODO: Link to medium article about our NFTs */}
                <EuiButton>Learn More</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiToolTip
                  position="bottom"
                  content="Coming soon"
                  display="block"
                >
                  <EuiButton isDisabled={true} fullWidth={true}>
                    Mint
                  </EuiButton>
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGrid>
            <EuiSpacer />
            <EuiSpacer />
            <EuiFlexGroup direction="column">
              <EuiFlexItem>
                <EuiTitle>
                  <h1>Roadmap</h1>
                </EuiTitle>
                <EuiText>TODO: Add roadmap.</EuiText>
              </EuiFlexItem>
              <EuiSpacer />
              <EuiFlexItem>
                <EuiTitle>
                  <h1>Frequently Asked Questions</h1>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem>{NftFaqAccordians()}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default OtterTotsPage;
