import {
  EuiButton,
  EuiCard,
  EuiFlexGrid,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { useTitle } from "../hooks";
import SWIM_BANNER from "../images/SWIM_BANNER.png";
import SWIM_LOGO_BLK from "../images/SWIM_LOGO_BLK.png";
import SWIM_LOGO_TEXT from "../images/SWIM_LOGO_TEXT.svg";
import SWIM_LOGO_WHT from "../images/SWIM_LOGO_WHT.png";

const MediaPage = (): ReactElement => {
  useTitle("Media");
  return (
    <EuiPage className="mediaPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>Media</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>
                <b>Press inquiries: </b>{" "}
                <a href="mailto:media@swim.io">media@swim.io</a>
              </p>
            </EuiText>
            <EuiSpacer />
            <EuiFlexGrid columns={3}>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description="Main Logo"
                  image={<img src={SWIM_LOGO_TEXT} alt="Main Logo" />}
                  footer={
                    <EuiButton href={SWIM_LOGO_TEXT}>Download SVG</EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description="White Logo"
                  image={
                    <img
                      style={{ backgroundColor: "#A9A9A9" }}
                      src={SWIM_LOGO_WHT}
                      alt="White Logo"
                    />
                  }
                  footer={
                    <EuiButton href={SWIM_LOGO_WHT}>Download PNG</EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description="Black Logo"
                  image={<img src={SWIM_LOGO_BLK} alt="Black Logo" />}
                  footer={
                    <EuiButton href={SWIM_LOGO_BLK}>Download PNG</EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
            </EuiFlexGrid>
            <EuiSpacer size="m" />
            <EuiCard
              title="Collection of Swim Logos"
              titleSize="s"
              description=""
              footer={
                <EuiButton href={"/assets/SWIM_Logo_Kit.zip"}>
                  Download
                </EuiButton>
              }
            ></EuiCard>
            <EuiSpacer />
            <EuiFlexItem>
              <EuiCard
                title="Docs"
                description="Learn more about our vision, product and team"
                href="https://docs.swim.io/swim-protocol/swim-team"
                image={
                  <div>
                    <img src={SWIM_BANNER} alt="Docs" />
                  </div>
                }
              ></EuiCard>
            </EuiFlexItem>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default MediaPage;
