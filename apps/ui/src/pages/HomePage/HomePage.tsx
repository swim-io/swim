import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHideFor,
  EuiIcon,
  EuiImage,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiShowFor,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import Decimal from "decimal.js";
import type { ReactElement, VFC } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { atomicToCurrencyString } from "../../amounts";
import { SwimIconType } from "../../components/CustomIconType";
import { GlassPanel } from "../../components/GlassPanel";
import { InvestorsList } from "../../components/InvestorsList";
import { Roadmap } from "../../components/Roadmap";
import type { Ecosystem } from "../../config";
import { ECOSYSTEMS } from "../../config";
import { useTitle } from "../../hooks";
import ECOSYSTEM_DIAGRAM from "../../images/ecosystem_diagram.svg";
import DISCORD_SVG from "../../images/social/discord.svg";
import TELEGRAM_SVG from "../../images/social/telegram.svg";
import TWITTER_SVG from "../../images/social/twitter.svg";
import "./HomePage.scss";

const HomePage = (): ReactElement => {
  const { t } = useTranslation();

  useTitle("");
  const navigate = useNavigate();
  const promotedEcosystems = [
    ECOSYSTEMS[SOLANA_ECOSYSTEM_ID],
    ECOSYSTEMS[EvmEcosystemId.Ethereum],
    ECOSYSTEMS[EvmEcosystemId.Bnb],
    ECOSYSTEMS[EvmEcosystemId.Avalanche],
    ECOSYSTEMS[EvmEcosystemId.Polygon],
    ECOSYSTEMS[EvmEcosystemId.Fantom],
    ECOSYSTEMS[EvmEcosystemId.Aurora],
    ECOSYSTEMS[EvmEcosystemId.Karura],
  ];

  const bountyAmount = atomicToCurrencyString(new Decimal(100_000), {
    minimumFractionDigits: 0,
  });

  return (
    <EuiPage restrictWidth className="homepage">
      <EuiPageBody>
        <EuiCallOut
          title={t("shutdown.announcement_title")}
          color="warning"
          iconType="alert"
        >
          <Trans
            i18nKey="shutdown.announcement_explanation"
            components={{
              a: (
                // eslint-disable-next-line jsx-a11y/anchor-has-content
                <a href="https://twitter.com/SwimProtocol/status/1589717317822611456" />
              ),
            }}
          />
        </EuiCallOut>
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiFlexGroup justifyContent="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup
              justifyContent="center"
              wrap={false}
              responsive={false}
            >
              {promotedEcosystems.map((ecosystem) => (
                <PromotedEcosystem ecosystem={ecosystem} key={ecosystem.id} />
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <div className="eui-textCenter">
          <EuiText color="ghost">
            <EuiTitle size="l">
              <h1 style={{ fontSize: "40px" }}>
                <EuiTextColor color="ghost">
                  {t("home_page.short_introduction")}
                </EuiTextColor>
                <div
                  className="bubble"
                  style={{ width: 40, height: 40, left: "10%", top: 150 }}
                ></div>
                <div
                  className="bubble"
                  style={{ width: 150, height: 150, left: "13%", top: 150 }}
                ></div>
                <div
                  className="bubble"
                  style={{ width: 80, height: 80, right: "10%", top: 140 }}
                ></div>
              </h1>
            </EuiTitle>
            <EuiSpacer size="xxl" />
            <EuiText
              style={{ maxWidth: "700px", margin: "auto", fontSize: "23px" }}
            >
              {t("home_page.long_introduction")}
            </EuiText>
          </EuiText>
          <EuiSpacer size="xxl" />

          <EuiFlexGroup justifyContent="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButton
                iconType={SwimIconType}
                color="ghost"
                fill
                href="/swap"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/swap");
                }}
              >
                {t("home_page.launch_app")}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="ghost" fill href="/whitepaper.pdf">
                {t("glossary.whitepaper")}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="xxl" />
          <EuiSpacer size="xxl" />

          <EuiFlexGroup justifyContent="center" responsive={false} wrap={true}>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="ghost"
                iconType={TWITTER_SVG}
                fill
                size="s"
                href="https://twitter.com/SwimProtocol"
              >
                {t("nav.twitter")}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="ghost"
                iconType={DISCORD_SVG}
                fill
                size="s"
                href="https://discord.gg/wGrxQ7GAgP"
              >
                {t("nav.discord")}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="ghost"
                iconType="documentEdit"
                fill
                size="s"
                href="https://blog.swim.io"
              >
                {t("nav.blog")}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="ghost"
                iconType={TELEGRAM_SVG}
                fill
                size="s"
                href="https://t.me/joinchat/Mnc1WjrKcq8yYTM1"
              >
                {t("nav.telegram")}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        <EuiFlexGroup gutterSize="l">
          <EuiFlexItem>
            <GlassPanel
              icon={<EuiIcon size="xxl" type="home" color="ghost" />}
              title={
                <EuiTextColor color="ghost">
                  {t("home_page.native_assets")}
                </EuiTextColor>
              }
            >
              <EuiText color="ghost">
                {t("home_page.native_assets_description")}
              </EuiText>
              <EuiSpacer />
            </GlassPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <GlassPanel
              icon={
                <EuiIcon size="xxl" type="advancedSettingsApp" color="ghost" />
              }
              title={
                <EuiTextColor color="ghost">
                  {t("home_page.dynamic_rates")}
                </EuiTextColor>
              }
              display="transparent"
            >
              <EuiText color="ghost">
                {t("home_page.dynamic_rates_description")}
              </EuiText>
            </GlassPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <GlassPanel
              icon={<EuiIcon size="xxl" type="indexPatternApp" color="ghost" />}
              title={
                <EuiTextColor color="ghost">
                  {t("home_page.multi_wallet_compatible")}
                </EuiTextColor>
              }
              display="transparent"
            >
              <EuiText color="ghost">
                {t("home_page.multi_wallet_compatible_description")}
              </EuiText>
            </GlassPanel>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        <div className="explanationDiagram__container eui-textCenter">
          <div className="explanationDiagram">
            <EuiSpacer size="l" />
            <EuiTitle size="l">
              <h2 style={{ color: "#1F62D2" }}>
                {t("home_page.dive_in_our_features")}
              </h2>
            </EuiTitle>
            <EuiSpacer size="xxl" />
            <EuiImage
              alt="Diagram explaining Swim"
              src={ECOSYSTEM_DIAGRAM}
              size="fullWidth"
            />
            <EuiSpacer size="l" />
            <EuiText style={{ color: "#1F62D2" }}>
              {t("home_page.dive_in_our_features_description")}
            </EuiText>
            <EuiSpacer size="xxl" />
          </div>
        </div>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        <div style={{ position: "relative" }}>
          <EuiTitle size="l">
            <h2>
              <EuiTextColor color="ghost">
                {t("home_page.our_investors")}
              </EuiTextColor>
            </h2>
          </EuiTitle>
          <EuiSpacer />

          <GlassPanel title="">
            <EuiTitle size="m">
              <h2>
                <EuiTextColor color="ghost">
                  {t("home_page.invested_by")}
                </EuiTextColor>
              </h2>
            </EuiTitle>
            <EuiSpacer />
            <InvestorsList />
          </GlassPanel>
        </div>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        <div style={{ position: "relative" }}>
          <EuiTitle size="l">
            <h2>
              <EuiTextColor color="ghost">
                {t("home_page.why_swim")}
              </EuiTextColor>
            </h2>
          </EuiTitle>
          <EuiSpacer />
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <GlassPanel
                icon={<EuiIcon size="xxl" type="vector" color="ghost" />}
                title={
                  <EuiTextColor color="ghost">
                    {t("home_page.bridging_a_multi_chain_world")}
                  </EuiTextColor>
                }
              >
                <EuiText color="ghost">
                  {t("home_page.bridging_a_multi_chain_world_description")}
                </EuiText>
              </GlassPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <GlassPanel
                icon={<EuiIcon size="xxl" type="merge" color="ghost" />}
                title={
                  <EuiTextColor color="ghost">
                    {t("home_page.amm_style_bridge")}
                  </EuiTextColor>
                }
              >
                <EuiText color="ghost">
                  {t("home_page.amm_style_bridge_description")}
                </EuiText>
              </GlassPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <GlassPanel
                icon={<EuiIcon size="xxl" type="layers" color="ghost" />}
                title={
                  <EuiTextColor color="ghost">
                    {t("home_page.core_building_block")}
                  </EuiTextColor>
                }
              >
                <EuiText color="ghost">
                  {t("home_page.core_building_block_description")}
                </EuiText>
              </GlassPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
          <div
            className="bubble"
            style={{ width: 120, height: 120, left: -60, bottom: -60 }}
          ></div>
          <div
            className="bubble"
            style={{ width: 30, height: 30, left: -100, bottom: -90 }}
          ></div>
          <div
            className="bubble"
            style={{ width: 50, height: 50, right: -50, top: 0 }}
          ></div>
        </div>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        <div style={{ position: "relative" }}>
          <EuiTitle size="l">
            <h2>
              <EuiTextColor color="ghost">
                {t("home_page.audited_and_verified")}
              </EuiTextColor>
            </h2>
          </EuiTitle>
          <EuiSpacer />
          <EuiFlexGroup>
            <EuiFlexItem>
              <GlassPanel
                icon={<EuiIcon size="xxl" type="securityApp" color="ghost" />}
                title={
                  <EuiTextColor color="ghost">
                    {t("home_page.audit")}
                  </EuiTextColor>
                }
                layout="horizontal"
              >
                <EuiText color="ghost">
                  {t("home_page.audit_description")}
                </EuiText>
                <EuiFlexGroup justifyContent="flexEnd">
                  <EuiFlexItem grow={false}>
                    <EuiButton color="ghost" fill href="/audits/kudelski.pdf">
                      {t("home_page.go_to_audit_report")}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </GlassPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <GlassPanel
                icon={<EuiIcon size="xxl" type="bug" color="ghost" />}
                title={
                  <EuiTextColor color="ghost">
                    {t("home_page.bug_bounty_program", { bountyAmount })}
                  </EuiTextColor>
                }
                layout="horizontal"
              >
                <EuiText color="ghost">
                  {t("home_page.bug_bounty_program_description", {
                    bountyAmount,
                  })}
                </EuiText>
                <EuiFlexGroup justifyContent="flexEnd">
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      color="ghost"
                      fill
                      href="https://immunefi.com/bounty/swimprotocol/"
                    >
                      {t("home_page.go_to_bug_bounty_program")}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </GlassPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />

        {/*<EuiFlexGrid columns={2} responsive={false}>
          <EuiFlexItem>
            <EuiTitle size="l">
              <h2>
                <EuiTextColor color="ghost">Running on Solana</EuiTextColor>
              </h2>
            </EuiTitle>
            <EuiSpacer size="xl" />
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                <EuiStat
                  title="65,000"
                  description="Peak transactions per second"
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiStat title="400ms" description="Block time" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiStat
                  title="$0.00001"
                  description="Average transaction cost"
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiStat
                  title="4000x"
                  description="Faster than Ethereum (TPS)"
                />
              </EuiFlexItem>
            </EuiFlexGrid>
          </EuiFlexItem>

          <EuiFlexItem>
            <div className="pulsating-solana-wrapper">
              <svg
                className="d-none d-lg-block max-width-85 pulsating-solana"
                viewBox="0 0 863 420"
                fill="none"
              >
                <g clipPath="url(#clip0)">
                  <path
                    fillRule="evenodd"
                    className="poly-2"
                    clipRule="evenodd"
                    d="M152.645 209.716L431.486 370.706L710.355 209.725L431.486 48.7061L152.645 209.716Z"
                    fill="#193650"
                  ></path>
                  <path
                    fillRule="evenodd"
                    className="poly-1"
                    clipRule="evenodd"
                    d="M217.004 209.713L431.763 333.706L646.545 209.721L431.763 85.7061L217.004 209.713Z"
                    fill="#193650"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M304.873 189.125V226.096L431.684 298.943L558.053 225.719L558.49 189.129"
                    fill="#040404"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M304.873 189.125L431.675 262.334L558.49 189.129L431.675 115.906L304.873 189.125Z"
                    fill="#382e37"
                  ></path>
                  <path
                    d="M423.04 209.878C423.041 209.376 423.386 208.895 424 208.54L480.693 175.812C481.725 175.216 483.491 175.638 483.491 176.481L483.482 189.41C483.481 189.912 483.136 190.393 482.522 190.748L425.829 223.476C424.797 224.072 423.031 223.65 423.031 222.807L423.04 209.878Z"
                    fill="url(#paint_d_linear)"
                  ></path>
                  <path
                    d="M381.223 185.736C381.223 185.235 381.568 184.754 382.183 184.399L438.875 151.67C439.908 151.074 441.674 151.497 441.673 152.34L441.664 165.269C441.664 165.771 441.318 166.252 440.704 166.606L384.012 199.335C382.979 199.931 381.213 199.508 381.214 198.665L381.223 185.736Z"
                    fill="url(#paint_e_linear)"
                  ></path>
                  <path
                    d="M449.946 170.05C449.077 170.05 448.244 170.249 447.629 170.604L390.937 203.333C389.904 203.929 390.636 204.948 392.097 204.948L414.492 204.943C415.361 204.943 416.194 204.743 416.809 204.389L473.501 171.66C474.534 171.064 473.802 170.044 472.341 170.045L449.946 170.05Z"
                    fill="url(#paint_f_linear)"
                  ></path>
                </g>
                <defs>
                  <linearGradient
                    id="paint_b_linear"
                    x1="50.7939"
                    y1="403.267"
                    x2="408.892"
                    y2="307.287"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#29D5D5"></stop>
                    <stop offset="1" stopColor="#3D326E"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint_a_linear"
                    x1="50.7939"
                    y1="403.267"
                    x2="408.892"
                    y2="307.287"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#9E22FF"></stop>
                    <stop offset="1" stopColor="#FF47ED"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint_c_linear"
                    x1="813.53"
                    y1="403.26"
                    x2="455.86"
                    y2="307.293"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#42F1C4"></stop>
                    <stop offset="1" stopColor="#16CD99"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint_d_linear"
                    x1="401.755"
                    y1="155.469"
                    x2="414.487"
                    y2="225.708"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3"></stop>
                    <stop offset="1" stopColor="#DC1FFF"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint_e_linear"
                    x1="401.755"
                    y1="155.469"
                    x2="414.487"
                    y2="225.708"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3"></stop>
                    <stop offset="1" stopColor="#DC1FFF"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint_f_linear"
                    x1="401.755"
                    y1="155.469"
                    x2="414.487"
                    y2="225.708"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3"></stop>
                    <stop offset="1" stopColor="#DC1FFF"></stop>
                  </linearGradient>
                  <clipPath id="clip0">
                    <rect width="863" height="450" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </EuiFlexItem>
        </EuiFlexGrid>

        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />*/}

        <EuiPanel color="transparent">
          <EuiTitle size="l" className="roadmap__title">
            <h2>
              <EuiTextColor color="ghost">
                {t("home_page.roadmap")}
              </EuiTextColor>
            </h2>
          </EuiTitle>
          <EuiSpacer />
          <Roadmap />
        </EuiPanel>

        <EuiSpacer size="xxl" />
      </EuiPageBody>
    </EuiPage>
  );
};

export default HomePage;

type PromotedEcosystemProps = {
  readonly ecosystem: Ecosystem;
};

const PromotedEcosystem: VFC<PromotedEcosystemProps> = ({ ecosystem }) => (
  <EuiFlexItem grow={false}>
    <EuiShowFor sizes={["xs"]}>
      <EuiIcon type={ecosystem.logo} title={ecosystem.displayName} size="l" />
    </EuiShowFor>
    <EuiHideFor sizes={["xs"]}>
      <EuiIcon type={ecosystem.logo} title={ecosystem.displayName} size="xxl" />
    </EuiHideFor>
  </EuiFlexItem>
);
