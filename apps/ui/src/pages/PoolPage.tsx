import {
  EuiBreadcrumbs,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
  EuiToolTip,
} from "@elastic/eui";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shallow from "zustand/shallow.js";

import {
  atomicToHumanString,
  displayAmount,
  displayPercentage,
} from "../amounts";
import { AddForm } from "../components/AddForm";
import { RemoveForm } from "../components/RemoveForm";
import { SlippageButton } from "../components/SlippageButton";
import { StatList } from "../components/StatList";
import { TokenIcon, TokenSpecIcon } from "../components/TokenIcon";
import type { PoolSpec } from "../config";
import { getSolanaTokenDetails } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import {
  usePool,
  useRegisterErc20Token,
  useTitle,
  useUserLpBalances,
} from "../hooks";
import BNB_SVG from "../images/ecosystems/bnb.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import { defaultIfError, pluralize } from "../utils";

const humanizeUsdAmount = (amount: string): string =>
  atomicToHumanString(new Decimal(amount), 2);

const PoolPage = (): ReactElement => {
  const { poolId } = useParams<{ readonly poolId: string }>();
  const { pools } = useEnvironment(selectConfig, shallow);

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

// TODO: Make code DRY.
const getPoolTitle = (poolSpec: PoolSpec): ReactElement => {
  return !poolSpec.isStableSwap ? (
    <EuiTitle>
      <h2>
        {poolSpec.displayName + "  "}
        <EuiToolTip
          position="right"
          content="This pool uses a constant product curve, prices deviate from 1:1."
        >
          <EuiIcon size="l" type="questionInCircle" color="primary" />
        </EuiToolTip>
      </h2>
    </EuiTitle>
  ) : (
    <EuiTitle>
      <h2>{poolSpec.displayName}</h2>
    </EuiTitle>
  );
};

export interface PoolPageInnerProps {
  readonly poolSpec: PoolSpec; // TODO: In PoolPage component, poolSpec can be null, that case should be taken as an option
}

export const PoolPageInner = ({
  poolSpec,
}: PoolPageInnerProps): ReactElement => {
  useTitle(poolSpec.displayName);
  const navigate = useNavigate();
  const { showPrompt: showRegisterEthereumTokenPrompt } = useRegisterErc20Token(
    ETHEREUM_ECOSYSTEM_ID,
  );
  const { showPrompt: showRegisterBnbTokenPrompt } =
    useRegisterErc20Token(BNB_ECOSYSTEM_ID);
  const {
    tokens,
    lpToken,
    state: poolState,
    poolTokenAccounts,
    userLpTokenAccount,
  } = usePool(poolSpec.id);
  const [slippagePercent, setSlippagePercent] = useState("1.0");
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
      title: <TokenSpecIcon token={tokenSpec} />,
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
        title: <TokenIcon {...lpToken.project} ecosystemId={ecosystemId} />,
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

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBreadcrumbs
            breadcrumbs={[
              {
                text: "Pools >",
                onClick: () => {
                  navigate("/pools");
                },
              },
            ]}
          />
          {getPoolTitle(poolSpec)}
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
        <EuiFlexItem style={{ minWidth: "50%" }}>
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
                  />
                ),
              },
            ]}
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
          {lpToken.detailsByEcosystem.has(ETHEREUM_ECOSYSTEM_ID) && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => showRegisterEthereumTokenPrompt(lpToken)}
              iconType={ETHEREUM_SVG}
            >
              Add LP token to Metamask
            </EuiButtonEmpty>
          )}
          {lpToken.detailsByEcosystem.has(BNB_ECOSYSTEM_ID) && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => showRegisterBnbTokenPrompt(lpToken)}
              iconType={BNB_SVG}
            >
              Add LP token to Metamask
            </EuiButtonEmpty>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
    </>
  );
};

export default PoolPage;
