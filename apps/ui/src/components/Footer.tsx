import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiToolTip,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { LanguageSelectorDropdown } from "./LanguageSelector";

export const Footer = (): ReactElement | null => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listGroupHeaderSize = "s";
  const listGroupItemSize = "xs";

  return (
    <EuiPanel
      grow={false}
      hasShadow={false}
      hasBorder={false}
      borderRadius="none"
      className="footer"
    >
      <EuiFlexGroup
        justifyContent="spaceEvenly"
        style={{ maxWidth: "1200px", width: "100%" }}
      >
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem label={t("nav.app")} size={listGroupHeaderSize} />
            <EuiListGroupItem
              label={t("nav.swap")}
              href="/swap"
              onClick={(e) => {
                e.preventDefault();
                navigate("/swap");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.pools")}
              href="/pools"
              onClick={(e) => {
                e.preventDefault();
                navigate("/pools");
              }}
              size={listGroupItemSize}
            />
            <EuiToolTip position="right" content={t("nav.coming_soon")}>
              <EuiListGroupItem
                label={t("nav.stake")}
                size={listGroupItemSize}
                isDisabled={true}
              />
            </EuiToolTip>
            <div />
            <EuiToolTip position="right" content={t("nav.coming_soon")}>
              <EuiListGroupItem
                label={t("nav.nfts")}
                size={listGroupItemSize}
                isDisabled={true}
              />
            </EuiToolTip>
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem
              label={t("nav.protocol")}
              size={listGroupHeaderSize}
            />
            <EuiListGroupItem
              label={t("nav.jobs")}
              href="https://apply.workable.com/swim/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.audit")}
              href="/audits/kudelski.pdf"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.bug_bounty")}
              href="https://immunefi.com/bounty/swimprotocol/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.security")}
              href="/security"
              onClick={(e) => {
                e.preventDefault();
                navigate("/security");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.terms_of_service")}
              href="/tos"
              onClick={(e) => {
                e.preventDefault();
                navigate("/tos");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.media")}
              href="/media"
              onClick={(e) => {
                e.preventDefault();
                navigate("/media");
              }}
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem
              label={t("nav.learn")}
              size={listGroupHeaderSize}
            />
            <EuiListGroupItem
              label={t("nav.blog")}
              href="https://blog.swim.io"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.faq")}
              href="https://docs.swim.io/alpha-launch/faq-alpha-launch"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.product_documentation")}
              href="https://docs.swim.io/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.github")}
              href="https://github.com/swim-io"
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem
              label={t("nav.community")}
              size={listGroupHeaderSize}
            />
            <EuiListGroupItem
              label={t("nav.twitter")}
              href="https://twitter.com/SwimProtocol"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.discord")}
              href="https://discord.gg/wGrxQ7GAgP"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label={t("nav.telegram")}
              href="https://t.me/joinchat/Mnc1WjrKcq8yYTM1"
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {process.env.REACT_APP_ENABLE_LANGUAGE_SELECTOR === "true" ? (
        <LanguageSelectorDropdown />
      ) : null}
    </EuiPanel>
  );
};
