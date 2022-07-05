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
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { createElement } from "react";
import { useNavigate } from "react-router-dom";

import { atomicToHumanString } from "../amounts";
import type { EcosystemId, TokenSpec } from "../config";
import { ECOSYSTEMS } from "../config";
import { groupBy } from "../utils";

import { TokenIcon } from "./TokenIcon";

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
          content="This pool uses a constant product curve, prices deviate from 1:1."
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

  const tokenSpecsByEcosystem = groupBy(
    tokenSpecs,
    (spec) => spec.nativeEcosystem,
  );
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
      <EuiSpacer size="m" />
      <EuiFlexGroup
        wrap
        justifyContent="spaceEvenly"
        alignItems="center"
        gutterSize="xl"
      >
        <EuiFlexItem>
          <EuiFlexGroup>
            {Object.entries(tokenSpecsByEcosystem).map(
              ([ecosystemId, tokens]) => {
                const ecosystem = ECOSYSTEMS[ecosystemId as EcosystemId];
                return (
                  <EuiFlexItem grow={false} key={ecosystemId}>
                    <EuiCard
                      title=""
                      key={ecosystemId}
                      // EUI Bug: need this so label is rendered
                      betaBadgeLabel={ecosystem.displayName}
                      betaBadgeProps={{
                        title: ecosystem.displayName,
                        iconType: ecosystem.logo,
                      }}
                      hasBorder
                      paddingSize="s"
                    >
                      {tokens.map((tokenSpec) => (
                        <div
                          key={tokenSpec.id}
                          style={{ marginBottom: 4, marginTop: 4 }}
                        >
                          <TokenIcon {...tokenSpec} />
                        </div>
                      ))}
                    </EuiCard>
                  </EuiFlexItem>
                );
              },
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {totalUsd !== null && (
            <EuiStat
              title={`$${atomicToHumanString(totalUsd, 2)}`}
              description=""
              titleSize={titleSize}
              isLoading={totalUsd.eq(new Decimal(-1))}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCard>
  );
};
