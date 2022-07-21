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

import { RecentInteractionsV2 } from "../components/RecentInteractionsV2";
import { SlippageButton } from "../components/SlippageButton";
import { SwapFormV2 } from "../components/SwapFormV2";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useTitle } from "../hooks";
import { INTERACTION_GROUP_SWAP } from "../models";
import { defaultIfError } from "../utils";

import "./SwapPage.scss";

const SwapPageV2 = (): ReactElement => {
  const { pools } = useEnvironment(selectConfig, shallow);

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
                  <h2>[WIP] Swap V2</h2>
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
              <SwapFormV2 maxSlippageFraction={slippageFraction} />
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>No pools found</h2>}
                titleSize="xs"
                body="Try changing the network in the upper right corner."
              />
            )}

            <EuiSpacer />
            <RecentInteractionsV2
              title="Recent swaps"
              interactionTypes={INTERACTION_GROUP_SWAP}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPageV2;
