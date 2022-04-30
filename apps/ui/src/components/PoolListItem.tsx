import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiStat,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useHistory } from "react-router-dom";

import { atomicToHumanString } from "../amounts";
import type { EcosystemId, TokenSpec } from "../config";
import { ecosystems } from "../config";
import { groupBy } from "../utils";

import { TokenIcon } from "./TokenIcon";

export const PoolListItem = ({
  title,
  tokenSpecs,
  poolId = null,
  totalUsd = null,
  betaBadgeLabel = "",
}: {
  readonly title: string;
  readonly tokenSpecs: readonly TokenSpec[];
  readonly poolId?: string | null;
  readonly totalUsd?: Decimal | null;
  readonly betaBadgeLabel?: string;
}): ReactElement => {
  const history = useHistory();

  const tokenSpecsByEcosystem = groupBy(
    tokenSpecs,
    (spec) => spec.nativeEcosystem,
  );
  return (
    <EuiCard
      title={title}
      layout="horizontal"
      hasBorder
      onClick={
        poolId
          ? () => {
              history.push(`/pools/${poolId}`);
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
                const ecosystem = ecosystems[ecosystemId as EcosystemId];
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
                          <TokenIcon {...tokenSpec} showFullName />
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
