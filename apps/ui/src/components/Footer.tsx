import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiToolTip,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Footer = (): ReactElement | null => {
  const navigate = useNavigate();
  const listGroupHeaderSize = "s";
  const listGroupItemSize = "xs";
  if (useLocation().pathname === "/swap") {
    return null;
  }

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
                navigate("/swap");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Pools"
              href="/pools"
              onClick={(e) => {
                e.preventDefault();
                navigate("/pools");
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
                navigate("/security");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Terms of Service"
              href="/tos"
              onClick={(e) => {
                e.preventDefault();
                navigate("/tos");
              }}
              size={listGroupItemSize}
            />
            <EuiListGroupItem
              label="Media"
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
