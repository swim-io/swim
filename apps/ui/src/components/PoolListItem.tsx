import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiStat,
  EuiTitle,
  EuiToolTip,
} from "@elastic/eui";
import { chunks } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { createElement } from "react";
import { useNavigate } from "react-router-dom";

import { atomicToCurrencyString } from "../amounts";
import type { TokenSpec } from "../config";
import { i18next } from "../i18n";

import { TokenSpecIcon } from "./TokenIcon";

const titleSize = "xs";
const titleElement = "h3";

const appendConstantSwapIcon = (poolName: string): string | ReactElement => {
  return (
    <EuiTitle size={titleSize}>
      {createElement(titleElement, {}, [
        poolName,
        <EuiToolTip
          key="tooltip"
          position="right"
          content={i18next.t("pool_page.pool_price_explanation")}
        >
          <EuiIcon size="l" type="questionInCircle" color="primary" />
        </EuiToolTip>,
      ])}
    </EuiTitle>
  );
};

export const PoolListItem = ({
  poolName,
  tokenSpecs,
  poolId = null,
  totalUsd = null,
  betaBadgeLabel = "",
  isStableSwap = true,
}: {
  readonly poolName: string;
  readonly tokenSpecs: readonly TokenSpec[];
  readonly poolId?: string | null;
  readonly totalUsd?: Decimal | null;
  readonly betaBadgeLabel?: string;
  readonly isStableSwap?: boolean;
}): ReactElement => {
  const navigate = useNavigate();
  const flexItemMargin = "6px 12px";
  const tokenChunks = chunks(tokenSpecs, 3);

  return (
    <EuiCard
      title={isStableSwap ? poolName : appendConstantSwapIcon(poolName)}
      layout="horizontal"
      hasBorder
      onClick={
        poolId
          ? () => {
              navigate(`/pools/${poolId}`);
            }
          : undefined
      }
      isDisabled={!!betaBadgeLabel}
      betaBadgeLabel={betaBadgeLabel}
      titleSize={titleSize}
      titleElement={titleElement}
    >
      <EuiSpacer size="s" />
      <EuiFlexGroup>
        {tokenChunks.map((tokens) => (
          <EuiFlexItem key={tokens.map((token) => token.id).join(":")}>
            <EuiFlexGroup direction="column" responsive={false}>
              {tokens.map((tokenSpec) => (
                <EuiFlexItem
                  key={tokenSpec.id}
                  grow={true}
                  style={{ margin: flexItemMargin }}
                >
                  <TokenSpecIcon token={tokenSpec} />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}

        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column">
            <EuiFlexItem style={{ margin: flexItemMargin }}>
              {totalUsd !== null && (
                <EuiStat
                  title={atomicToCurrencyString(totalUsd)}
                  description=""
                  titleSize={titleSize}
                  isLoading={totalUsd.eq(new Decimal(-1))}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCard>
  );
};
