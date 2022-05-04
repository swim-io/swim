import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiToolTip,
} from "@elastic/eui";
import type { ReactElement, ReactNode } from "react";
import { useHistory, useLocation } from "react-router-dom";

import "./Waves.scss";

const Footer = (): ReactElement => {
  const history = useHistory();
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
      <EuiFlexGroup justifyContent="spaceEvenly" style={{ maxWidth: "1200px" }}>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem label="App" size={listGroupHeaderSize} />
            <EuiListGroupItem
              label="Swap"
              href="/swap"
              onClick={(e) => {
                e.preventDefault();
                history.push("/swap");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Pools"
              href="/pools"
              onClick={(e) => {
                e.preventDefault();
                history.push("/pools");
              }}
              size={listGroupItemSize}
            />
            <EuiToolTip position="right" content="Coming soon!">
              <EuiListGroupItem
                label="Stake"
                size={listGroupItemSize}
                isDisabled={true}
              />
            </EuiToolTip>
            <div />
            <EuiToolTip position="right" content="Coming soon!">
              <EuiListGroupItem
                label="NFTs"
                size={listGroupItemSize}
                isDisabled={true}
              />
            </EuiToolTip>
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem label="Protocol" size={listGroupHeaderSize} />
            <EuiListGroupItem
              label="Jobs"
              href="https://apply.workable.com/swim/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Audit"
              href="/audits/kudelski.pdf"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Bug Bounty"
              href="https://immunefi.com/bounty/swimprotocol/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Security"
              href="/security"
              onClick={(e) => {
                e.preventDefault();
                history.push("/security");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Terms of Service"
              href="/tos"
              onClick={(e) => {
                e.preventDefault();
                history.push("/tos");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Media"
              href="/media"
              onClick={(e) => {
                e.preventDefault();
                history.push("/media");
              }}
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem label="Learn" size={listGroupHeaderSize} />
            <EuiListGroupItem
              label="Blog"
              href="https://blog.swim.io"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="FAQ"
              href="https://docs.swim.io/alpha-launch/faq-alpha-launch"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Docs"
              href="https://docs.swim.io/"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Github"
              href="https://github.com/swim-io"
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem label="Community" size={listGroupHeaderSize} />
            <EuiListGroupItem
              label="Twitter"
              href="https://twitter.com/SwimProtocol"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Discord"
              href="https://discord.gg/wGrxQ7GAgP"
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Telegram"
              href="https://t.me/joinchat/Mnc1WjrKcq8yYTM1"
              size={listGroupItemSize}
            />
          </EuiListGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

interface WavesProps {
  readonly children?: ReactNode;
}

export const Waves = ({ children }: WavesProps): ReactElement => {
  return (
    <div className="wavesContainer">
      {children}
      <div className={"wavesGradient"}></div>
      <svg
        className="waves"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g className="parallax">
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="0"
            fill="rgba(255,255,255,0.7)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="3"
            fill="rgba(255,255,255,0.5)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="5"
            fill="rgba(255,255,255,0.3)"
          />
          <use xlinkHref="#gentle-wave" x="48" y="7" fill="#f9fafd" />
        </g>
      </svg>
      {useLocation().pathname === "/swap" ? <></> : <Footer />}
    </div>
  );
};
