import {
  EuiBreadcrumbs,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  atomicToHumanString,
  displayAmount,
  displayPercentage,
} from "../amounts";
import { AddForm } from "../components/AddForm";
import { RecentInteractions } from "../components/RecentInteractions";
import { RemoveForm } from "../components/RemoveForm";
import { SlippageButton } from "../components/SlippageButton";
import { StatList } from "../components/StatList";
import { NativeTokenIcon, TokenIcon } from "../components/TokenIcon";
import type { PoolSpec } from "../config";
import { EcosystemId, getSolanaTokenDetails } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import {
  usePool,
  useRegisterErc20Token,
  useTitle,
  useUserLpBalances,
} from "../hooks";
import BSC_SVG from "../images/ecosystems/bsc.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import { defaultIfError, pluralize } from "../utils";

const humanizeUsdAmount = (amount: string): string =>
  atomicToHumanString(new Decimal(amount), 2);

const PoolPage = (): ReactElement => {
  const { poolId } = useParams<{ readonly poolId: string }>();
  const { pools } = useEnvironment(selectConfig);

  const poolSpec = pools.find((pool) => pool.id === poolId) ?? null;

  return (
    <EuiPage className="poolPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            {poolSpec ? (
              <PoolPageInner poolSpec={poolSpec} />
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>Pool not found</h2>}
                titleSize="xs"
                body="Try changing the network in the upper right corner."
              />
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export interface PoolPageInnerProps {
  readonly poolSpec: PoolSpec; // TODO: In PoolPage component, poolSpec can be null, that case should be taken as an option
}

export const PoolPageInner = ({
  poolSpec,
}: PoolPageInnerProps): ReactElement => {
  useTitle(poolSpec.displayName);
  const history = useHistory();
  const [currentInteraction, setCurrentInteraction] = useState<string | null>(
    null,
  );
  const [isAdd, setIsAdd] = useState(true);
  const { showPrompt: showRegisterEthereumTokenPrompt } = useRegisterErc20Token(
    EcosystemId.Ethereum,
  );
  const { showPrompt: showRegisterBscTokenPrompt } = useRegisterErc20Token(
    EcosystemId.Bsc,
  );
  const {
    tokens,
    lpToken,
    state: poolState,
    poolTokenAccounts,
    userLpTokenAccount,
  } = usePool(poolSpec.id);
  const [slippagePercent, setSlippagePercent] = useState("0.5");
  const slippageFraction = useMemo(
    () => defaultIfError(() => new Decimal(slippagePercent).div(100), null),
    [slippagePercent],
  );

  const reserveStats = tokens.map((tokenSpec) => {
    const solanaDetails = getSolanaTokenDetails(tokenSpec);
    const poolTokenAccount =
      poolTokenAccounts?.find(
        (account) =>
          account && account.mint.toBase58() === solanaDetails.address,
      ) ?? null;
    return {
      title: <NativeTokenIcon {...tokenSpec} />,
      description: poolTokenAccount
        ? humanizeUsdAmount(
            displayAmount(
              poolTokenAccount.amount.toString(),
              solanaDetails.decimals,
            ),
          )
        : "-",
      key: tokenSpec.id,
    };
  });

  const userLpBalances = useUserLpBalances(lpToken, userLpTokenAccount);
  const userLpStats = [...lpToken.detailsByEcosystem.keys()].map(
    (ecosystemId) => {
      const userLpBalance = userLpBalances[ecosystemId];
      return {
        title: <TokenIcon {...lpToken} ecosystemId={ecosystemId} />,
        description: userLpBalance
          ? userLpBalance.toFormattedHumanString(ecosystemId)
          : "-",
        key: ecosystemId,
      };
    },
  );

  const poolInfoStats = poolState
    ? [
        {
          title: "LP Fee",
          description: displayPercentage(
            poolState.lpFee.toString(),
            poolSpec.feeDecimals,
          ),
          key: "lp_fee",
        },
        {
          title: "Governance Fee",
          description: displayPercentage(
            poolState.governanceFee.toString(),
            poolSpec.feeDecimals,
          ),
          key: "governance_fee",
        },
      ]
    : [];

  const recentInteractionsTitle = useMemo(() => {
    if (poolSpec.isStakingPool) {
      return isAdd ? "Recent stakes" : "Recent unstakes";
    }
    return isAdd ? "Recent adds" : "Recent removals";
  }, [poolSpec.isStakingPool, isAdd]);

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBreadcrumbs
            breadcrumbs={[
              {
                text: "Pools >",
                onClick: () => {
                  history.push("/pools");
                },
              },
            ]}
          />

          <EuiTitle>
            <h2>{poolSpec.displayName}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SlippageButton
            slippagePercent={slippagePercent}
            setSlippagePercent={setSlippagePercent}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup justifyContent="spaceAround" gutterSize="xl">
        <EuiFlexItem>
          <EuiTabbedContent
            expand={true}
            size="m"
            tabs={[
              {
                id: "add",
                name: poolSpec.isStakingPool ? "Stake" : "Add",
                content: (
                  <AddForm
                    poolSpec={poolSpec}
                    maxSlippageFraction={slippageFraction}
                    setCurrentInteraction={setCurrentInteraction}
                  />
                ),
              },
              {
                id: "remove",
                name: poolSpec.isStakingPool ? "Unstake" : "Remove",
                content: (
                  <RemoveForm
                    poolSpec={poolSpec}
                    maxSlippageFraction={slippageFraction}
                    setCurrentInteraction={setCurrentInteraction}
                  />
                ),
              },
            ]}
            onTabClick={({ id }) => {
              setIsAdd(id === "add");
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h4>{pluralize("Pool Balance", tokens.length > 1)}</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <StatList listItems={reserveStats} />
          <EuiSpacer />
          <EuiTitle size="xxs">
            <h4>{pluralize("User Balance", tokens.length > 1)}</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <StatList listItems={userLpStats} />
          <EuiSpacer />
          {!poolSpec.isStakingPool && (
            <>
              <EuiTitle size="xxs">
                <h4>Pool Info</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <StatList listItems={poolInfoStats} />
            </>
          )}
          {lpToken.detailsByEcosystem.has(EcosystemId.Ethereum) && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => showRegisterEthereumTokenPrompt(lpToken)}
              iconType={ETHEREUM_SVG}
            >
              Add LP token to Metamask
            </EuiButtonEmpty>
          )}
          {lpToken.detailsByEcosystem.has(EcosystemId.Bsc) && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => showRegisterBscTokenPrompt(lpToken)}
              iconType={BSC_SVG}
            >
              Add LP token to Metamask
            </EuiButtonEmpty>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <RecentInteractions
        title={recentInteractionsTitle}
        poolId={poolSpec.id}
        currentInteraction={currentInteraction}
      />
    </>
  );
};

export default PoolPage;
