import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import { RecentInteractions } from "../../components/RecentInteractions";
import { SlippageButton } from "../../components/SlippageButton";
import { SwapForm } from "../../components/SwapForm";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useTitle } from "../../hooks";
import { INTERACTION_GROUP_SWAP } from "../../models";
import { defaultIfError } from "../../utils";

import "./SwapPage.scss";

const SwapPage = (): ReactElement => {
  const { pools } = useEnvironment(selectConfig, shallow);

  // TODO: use useSwapTokens() hook and pass down props to SwapForm.
  useTitle("Swap");

  const nonStakingPools = useMemo(
    () => pools.filter((pool) => !pool.isStakingPool),
    [pools],
  );

  const [slippagePercent, setSlippagePercent] = useState("0.5");
  const slippageFraction = useMemo(
    () => defaultIfError(() => new Decimal(slippagePercent).div(100), null),
    [slippagePercent],
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
              <EuiFlexItem grow={false}>
                <SlippageButton
                  slippagePercent={slippagePercent}
                  setSlippagePercent={setSlippagePercent}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer />
            {nonStakingPools.length > 0 ? (
              <SwapForm maxSlippageFraction={slippageFraction} />
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
              interactionTypes={INTERACTION_GROUP_SWAP}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPage;
