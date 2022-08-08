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
import { useTranslation } from "react-i18next";

import { useTitle } from "../hooks";
import SWIM_BANNER from "../images/SWIM_BANNER.png";
import SWIM_LOGO_BLK from "../images/SWIM_LOGO_BLK.png";
import SWIM_LOGO_TEXT from "../images/SWIM_LOGO_TEXT.svg";
import SWIM_LOGO_WHT from "../images/SWIM_LOGO_WHT.png";

const MediaPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.media"));
  return (
    <EuiPage className="mediaPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{t("nav.media")}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>
                <b>{t("media_page.press_inquiries")}</b>{" "}
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <a href="mailto:media@swim.io">media@swim.io</a>
              </p>
            </EuiText>
            <EuiSpacer />
            <EuiFlexGrid columns={3}>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description={t("media_page.main_logo") ?? ""}
                  image={
                    <img src={SWIM_LOGO_TEXT} alt={t("media_page.main_logo")} />
                  }
                  footer={
                    <EuiButton href={SWIM_LOGO_TEXT}>
                      {t("media_page.download_svg")}
                    </EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description={t("media_page.white_logo") ?? ""}
                  image={
                    <img
                      style={{ backgroundColor: "#A9A9A9" }}
                      src={SWIM_LOGO_WHT}
                      alt={t("media_page.white_logo")}
                    />
                  }
                  footer={
                    <EuiButton href={SWIM_LOGO_WHT}>
                      {t("media_page.download_png")}
                    </EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCard
                  title=""
                  description={t("media_page.black_logo") ?? ""}
                  image={
                    <img src={SWIM_LOGO_BLK} alt={t("media_page.black_logo")} />
                  }
                  footer={
                    <EuiButton href={SWIM_LOGO_BLK}>
                      {t("media_page.download_png")}
                    </EuiButton>
                  }
                ></EuiCard>
              </EuiFlexItem>
            </EuiFlexGrid>
            <EuiSpacer size="m" />
            <EuiCard
              title={t("media_page.logo_collection")}
              titleSize="s"
              description=""
              footer={
                <EuiButton href={"/assets/SWIM_Logo_Kit.zip"}>
                  {t("general.download")}
                </EuiButton>
              }
            ></EuiCard>
            <EuiSpacer />
            <EuiFlexItem>
              <EuiCard
                title={t("nav.product_documentation")}
                description={t("media_page.learn_more_on_the_team") ?? ""}
                href="https://docs.swim.io/swim-protocol/swim-team"
                image={
                  <div>
                    <img
                      src={SWIM_BANNER}
                      alt={t("nav.product_documentation")}
                    />
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
