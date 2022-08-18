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
import { useTranslation } from "react-i18next";

import {
  AlternatingFeaturettes,
  IsWhitelistedButton,
  NftFaqAccordians,
  NftRoadmap,
} from "../components/OtterTotsLandingPageComponents";
import { useTitle } from "../hooks";
import OTTER_SLIDESHOW from "../images/otter_slideshow.gif";

const OtterTotsPage = (): ReactElement => {
  const { t } = useTranslation();
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
                  <p
                    // bypass i18next/no-literal-string
                    // eslint-disable-next-line react/no-children-prop
                    children="Lorem ipsum dolor sit amet, consectetur adipiscing elit, seddo eiusmod tempor incididunt ut labore et dolore magnaaliqua. Ut enim ad minim veniam, quis nostrud exercitationullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velitesse cillum dolore eu fugiat nulla pariatur. Excepteur sintoccaecat cupidatat non proident, sunt in culpa qui officiadeserunt mollit anim id est laborum."
                  />
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
                <EuiButton fill={true}>
                  {t("otter_tots_page.learn_more")}
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem>
                <IsWhitelistedButton />
              </EuiFlexItem>
            </EuiFlexGrid>
            <EuiSpacer />
            <EuiSpacer />
            <EuiFlexGroup direction="column">
              <EuiFlexItem>
                <EuiTitle>
                  <h1>{t("otter_tots_page.roadmap")}</h1>
                </EuiTitle>
                <EuiSpacer />
                <NftRoadmap />
              </EuiFlexItem>
              <EuiSpacer />
              <EuiFlexItem>
                <EuiTitle>
                  <h1>{t("otter_tots_page.frequently_asked_questions")}</h1>
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
