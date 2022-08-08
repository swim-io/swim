import {
  EuiHeader,
  EuiHeaderLinks,
  EuiHeaderSectionItem,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { MultiConnectButton } from "../ConnectButton";
import { CustomHeaderLink } from "../CustomHeaderLink";
import { CustomHeaderLogo } from "../CustomHeaderLogo";
import { EnvSelector } from "../EnvSelector";
import { Footer } from "../Footer";
import { Waves } from "../Waves";

import "./Layout.scss";

export const Layout = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { t } = useTranslation();
  return (
    <Waves footer={<Footer />}>
      <EuiSpacer />
      <EuiSpacer />
      <EuiHeader
        position="fixed"
        sections={[
          {
            items: [
              <CustomHeaderLogo key="custom-header-logo" />,
              <EuiHeaderLinks key="eui-header-links">
                <CustomHeaderLink to={"/swap"}>
                  {t("nav.swap")}
                </CustomHeaderLink>
                {process.env.REACT_APP_ENABLE_POOL_RESTRUCTURE && (
                  <CustomHeaderLink to={"/swapV2"}>
                    {t("nav.swap_v2")}
                  </CustomHeaderLink>
                )}
                <CustomHeaderLink to={"/pools"}>
                  {t("nav.pools")}
                </CustomHeaderLink>
                {/* TODO: Enable when token is launched */}
                {/* <CustomHeaderLink to={"/stake"}>Stake</CustomHeaderLink> */}
                <CustomHeaderLink to={"/help"}>
                  {t("nav.help")}
                </CustomHeaderLink>
              </EuiHeaderLinks>,
            ],
            borders: "right",
          },
          {
            items: [
              <EuiHeaderSectionItem key="eui-header-section-item">
                <MultiConnectButton size="s" fullWidth />
              </EuiHeaderSectionItem>,
              <EnvSelector key="env-selector" />,
            ],
            borders: "none",
          },
        ]}
      />
      {children}
    </Waves>
  );
};
