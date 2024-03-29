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
import { defaultIfError } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { MultiConnectButton } from "../../components/ConnectButton";
import { RecentInteractionsV2 } from "../../components/RecentInteractionsV2";
import { SlippageButton } from "../../components/SlippageButton";
import { SwapFormV2 } from "../../components/SwapFormV2";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useTitle } from "../../hooks";
import { INTERACTION_GROUP_SWAP } from "../../models";

import "./SwapPageV2.scss";

const SwapPageV2 = (): ReactElement => {
  const { t } = useTranslation();
  const { pools } = useEnvironment(selectConfig, shallow);

  useTitle(t("nav.swap_v2"));

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
    <EuiPage restrictWidth={620} className="swapPage">
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>{t("nav.swap_v2")}</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false} className="buttons">
                <MultiConnectButton size="s" fullWidth />
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
                title={<h2>{t("general.error_cannot_found_pools")}</h2>}
                titleSize="xs"
                body={t("general.action_on_error_cannot_found_pools")}
              />
            )}

            <EuiSpacer />
            <RecentInteractionsV2
              title={t("swap_page.recent_swaps")}
              interactionTypes={INTERACTION_GROUP_SWAP}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPageV2;
