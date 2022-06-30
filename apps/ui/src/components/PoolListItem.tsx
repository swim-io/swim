import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiToolTip,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { atomicToHumanString } from "../amounts";
import type { EcosystemId, TokenSpec } from "../config";
import { ECOSYSTEMS } from "../config";
import { groupBy } from "../utils";

import { TokenIcon } from "./TokenIcon";

// TODO: Make code DRY.
const appendConstantSwapIcon = (poolName: string): string | ReactElement => {
  return (
    <EuiText>
      <h3>
        {poolName + "  "}
        <EuiToolTip
          position="right"
          content="This pool uses a constant product curve, prices deviate from 1:1."
        >
          <EuiIcon size="l" type="questionInCircle" color="primary" />
        </EuiToolTip>
      </h3>
    </EuiText>
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
                      paddingSize="m"
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
              titleSize="s"
              isLoading={totalUsd.eq(new Decimal(-1))}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCard>
  );
};
