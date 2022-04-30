import {
  EuiHeader,
  EuiHeaderLinks,
  EuiHeaderSectionItem,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement, ReactNode } from "react";

import { MultiConnectButton } from "./ConnectButton";
import { CustomHeaderLink } from "./CustomHeaderLink";
import { CustomHeaderLogo } from "./CustomHeaderLogo";
import { EnvSelector } from "./EnvSelector";
import { Waves } from "./Waves";

import "./Layout.scss";

export const Layout = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  return (
    <Waves>
      <EuiSpacer />
      <EuiSpacer />
      <EuiHeader
        position="fixed"
        sections={[
          {
            items: [
              <CustomHeaderLogo key="custom-header-logo" />,
              <EuiHeaderLinks key="eui-header-links">
                <CustomHeaderLink to={"/swap"}>Swap</CustomHeaderLink>
                <CustomHeaderLink to={"/pools"}>Pools</CustomHeaderLink>
                {/* TODO: Enable when token is launched */}
                {/* <CustomHeaderLink to={"/stake"}>Stake</CustomHeaderLink> */}
                <CustomHeaderLink to={"/help"}>Help</CustomHeaderLink>
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
