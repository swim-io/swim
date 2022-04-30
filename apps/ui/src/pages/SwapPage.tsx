import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHideFor,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiShowFor,
  EuiSpacer,
  EuiSuperSelect,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { RecentInteractions } from "../components/RecentInteractions";
import { SlippageButton } from "../components/SlippageButton";
import { SwapForm } from "../components/SwapForm";
import { useConfig } from "../contexts";
import { useTitle } from "../hooks";
import { SwimDefiInstruction } from "../models";
import { defaultIfError } from "../utils";

import "./SwapPage.scss";

const SwapPage = (): ReactElement => {
  const { pools } = useConfig();
  useTitle("Swap");

  const nonStakingPools = useMemo(
    () => pools.filter((pool) => !pool.isStakingPool),
    [pools],
  );

  const [poolId, setPoolId] = useState(nonStakingPools[0].id);
  const [currentInteraction, setCurrentInteraction] = useState<string | null>(
    null,
  );
  const [slippagePercent, setSlippagePercent] = useState("0.5");
  const slippageFraction = useMemo(
    () => defaultIfError(() => new Decimal(slippagePercent).div(100), null),
    [slippagePercent],
  );

  const poolIdOptions = useMemo(
    () =>
      nonStakingPools.map((pool) => ({
        value: pool.id,
        inputDisplay: pool.displayName,
      })),
    [nonStakingPools],
  );

  return (
    <EuiPage restrictWidth={800} className="swapPage">
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Swap</h2>
                </EuiTitle>
              </EuiFlexItem>
              {nonStakingPools.length > 1 && (
                <EuiHideFor sizes={["xs"]}>
                  <EuiFlexItem grow={false}>
                    <EuiSuperSelect
                      name="poolId"
                      options={poolIdOptions}
                      valueOfSelected={poolId}
                      onChange={setPoolId}
                      compressed
                    />
                  </EuiFlexItem>
                </EuiHideFor>
              )}
              <EuiFlexItem grow={false}>
                <SlippageButton
                  slippagePercent={slippagePercent}
                  setSlippagePercent={setSlippagePercent}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer />
            <EuiShowFor sizes={["xs"]}>
              {nonStakingPools.length > 1 && (
                <EuiSuperSelect
                  name="poolId"
                  options={poolIdOptions}
                  valueOfSelected={poolId}
                  onChange={setPoolId}
                  compressed
                />
              )}
            </EuiShowFor>
            {pools.length > 0 ? (
              <SwapForm
                poolId={poolId}
                setCurrentInteraction={setCurrentInteraction}
                maxSlippageFraction={slippageFraction}
              />
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>No pools found</h2>}
                titleSize="xs"
                body="Try changing the network in the upper right corner."
              />
            )}

            <EuiSpacer />
            <RecentInteractions
              title="Recent swaps"
              poolId={null}
              instructions={[SwimDefiInstruction.Swap]}
              currentInteraction={currentInteraction}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPage;
