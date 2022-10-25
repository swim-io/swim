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
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { defaultIfError } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { MultiConnectButton } from "../../components/ConnectButton";
import { RecentInteractions } from "../../components/RecentInteractions";
import { SlippageButton } from "../../components/SlippageButton";
import { SwapForm } from "../../components/SwapForm";
import { ECOSYSTEMS } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useSwapTokensContext, useTitle } from "../../hooks";
import { INTERACTION_GROUP_SWAP } from "../../models";

import "./SwapPage.scss";

const SwapPage = (): ReactElement => {
  const { t } = useTranslation();
  const { pools } = useEnvironment(selectConfig, shallow);

  const { fromToken, toToken } = useSwapTokensContext();
  const fromEcosystemName = ECOSYSTEMS[fromToken.nativeEcosystemId].displayName;
  const fromTokenProjectId =
    TOKEN_PROJECTS_BY_ID[fromToken.projectId].displayName;
  const toEcosystemName = ECOSYSTEMS[toToken.nativeEcosystemId].displayName;
  const toTokenProjectId = TOKEN_PROJECTS_BY_ID[toToken.projectId].displayName;
  useTitle(
    t("swap_page.title", {
      fromEcosystemName,
      fromTokenProjectId,
      toEcosystemName,
      toTokenProjectId,
    }),
  );

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
                  <h2>{t("nav.swap")}</h2>
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
              <SwapForm maxSlippageFraction={slippageFraction} />
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>{t("general.error_cannot_found_pools")}</h2>}
                titleSize="xs"
                body={t("general.action_on_error_cannot_found_pools")}
              />
            )}

            <EuiSpacer />
            <RecentInteractions
              title={t("swap_page.recent_swaps")}
              interactionTypes={INTERACTION_GROUP_SWAP}
            />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default SwapPage;
