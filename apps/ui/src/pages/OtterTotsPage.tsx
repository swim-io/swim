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
} from "@elastic/eui";
import type { ReactElement } from "react";

import {
  AlternatingFeaturettes,
  ConvolutedButton,
  NftFaqAccordians,
  NftRoadmap,
} from "../components/OtterTotsLandingPageComponents";
import { useTitle } from "../hooks";
import OTTER_SLIDESHOW from "../images/otter_slideshow.gif";

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
                <EuiImage src={OTTER_SLIDESHOW} alt="" size="l" />
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
            <EuiSpacer />
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                {/* TODO: Link to medium article about our NFTs */}
                <EuiButton fill={true}>Learn More</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem>
                <ConvolutedButton />
              </EuiFlexItem>
            </EuiFlexGrid>
            <EuiSpacer />
            <EuiSpacer />
            <EuiFlexGroup direction="column">
              <EuiFlexItem>
                <EuiTitle>
                  <h1>Roadmap</h1>
                </EuiTitle>
                <EuiSpacer />
                <NftRoadmap />
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
