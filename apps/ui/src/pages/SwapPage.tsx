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
import { useEffect, useMemo, useState } from "react";
import shallow from "zustand/shallow";

import { RecentInteractionsV2 } from "../components/RecentInteractionsV2";
import { SlippageButton } from "../components/SlippageButton";
import { SwapForm } from "../components/SwapForm";
import { selectConfig } from "../core/selectors";
import { useEnvironment, useInteractionState } from "../core/store";
import { useTitle } from "../hooks";
import { InteractionType } from "../models";
import { defaultIfError } from "../utils";

import "./SwapPage.scss";

const SwapPage = (): ReactElement => {
  const { pools } = useEnvironment(selectConfig, shallow);
  const env = useEnvironment((state) => state.env);
  const loadInteractionStatesFromIDB = useInteractionState(
    (state) => state.loadInteractionStatesFromIDB,
  );
  useEffect(() => {
    loadInteractionStatesFromIDB(env);
  }, [env, loadInteractionStatesFromIDB]);

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
            <RecentInteractionsV2
              title="Recent swaps"
              interactionTypes={[InteractionType.Swap]}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPage;
