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
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { defaultIfError } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  TokenIcon,
  TokenOptionIcon,
  TokenSpecIcon,
} from "../components/TokenIcon";
import type { PoolSpec } from "../config";
import {
  EcosystemId,
  getSolanaTokenDetails,
  getTokenDetailsForEcosystem,
} from "../config";
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
import { isEvmPoolState } from "../models";

const PoolPage = (): ReactElement => {
  const { t } = useTranslation();
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
                title={<h2>{t("general.error_cannot_found_pool")}</h2>}
                titleSize="xs"
                body={t("general.action_on_error_cannot_found_pool")}
              />
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

// TODO: Make code DRY.
interface PoolTitleProps {
  readonly poolSpec: PoolSpec;
}
const PoolTitle = ({ poolSpec }: PoolTitleProps): ReactElement => {
  const { t } = useTranslation();
  return !poolSpec.isStableSwap ? (
    <EuiTitle>
      <h2>
        {poolSpec.displayName + "  "}
        <EuiToolTip
          position="right"
          content={t("pool_page.pool_price_explanation")}
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

interface PoolPageInnerProps {
  readonly poolSpec: PoolSpec; // TODO: In PoolPage component, poolSpec can be null, that case should be taken as an option
}

export const PoolPageInner = ({
  poolSpec,
}: PoolPageInnerProps): ReactElement => {
  const { t } = useTranslation();
  useTitle(poolSpec.displayName);
  const navigate = useNavigate();
  const { showPrompt: showRegisterEthereumTokenPrompt } = useRegisterErc20Token(
    EcosystemId.Ethereum,
  );
  const { showPrompt: showRegisterBnbTokenPrompt } = useRegisterErc20Token(
    EcosystemId.Bnb,
  );
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

  const reserveStats = tokens.map((tokenSpec, i) => {
    const solanaDetails = getSolanaTokenDetails(tokenSpec);

    if (isEvmPoolState(poolState)) {
      return {
        title: (
          <TokenOptionIcon
            tokenOption={{
              tokenId: tokenSpec.id,
              ecosystemId: poolSpec.ecosystem,
            }}
          />
        ),
        description: atomicToHumanString(
          new Decimal(poolState.balances[i].toString()),
          2,
        ),
        key: tokenSpec.id,
      };
    }

    const poolTokenAccount =
      poolTokenAccounts?.find(
        (account) =>
          account && account.mint.toBase58() === solanaDetails.address,
      ) ?? null;
    return {
      title: <TokenSpecIcon token={tokenSpec} />,
      description: poolTokenAccount
        ? atomicToHumanString(
            new Decimal(
              displayAmount(
                poolTokenAccount.amount.toString(),
                solanaDetails.decimals,
              ),
            ),
            2,
          )
        : "-",
      key: tokenSpec.id,
    };
  });

  const userLpBalances = useUserLpBalances(lpToken, userLpTokenAccount);
  const userLpStats = [
    lpToken.nativeEcosystemId,
    ...(poolSpec.isLegacyPool ? lpToken.wrappedDetails.keys() : []),
  ].map((ecosystemId) => {
    const userLpBalance = userLpBalances[ecosystemId];
    return {
      title: (
        <TokenIcon
          {...TOKEN_PROJECTS_BY_ID[lpToken.projectId]}
          ecosystemId={ecosystemId}
        />
      ),
      description: userLpBalance
        ? userLpBalance.toFormattedHumanString(ecosystemId)
        : "-",
      key: ecosystemId,
    };
  });

  const poolInfoStats = poolState
    ? [
        {
          title: t("glossary.liquidity_provider_fee"),
          description: displayPercentage(
            poolState.lpFee.toString(),
            poolSpec.feeDecimals,
          ),
          key: "lp_fee",
        },
        {
          title: t("glossary.governance_fee"),
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
                text: `${t("nav.pools")} >`,
                onClick: () => {
                  navigate("/pools");
                },
              },
            ]}
          />
          <PoolTitle poolSpec={poolSpec} />
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
                name: poolSpec.isStakingPool
                  ? t("glossary.stake_tokens")
                  : t("general.add_tokens_to_pool"),
                content: (
                  <AddForm
                    poolSpec={poolSpec}
                    maxSlippageFraction={slippageFraction}
                  />
                ),
              },
              {
                id: "remove",
                name: poolSpec.isStakingPool
                  ? t("glossary.unstake_tokens")
                  : t("general.remove_tokens_from_pool"),
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
            <h4>
              {t("pool_page.pool_balance", { count: reserveStats.length })}
            </h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <StatList listItems={reserveStats} />
          <EuiSpacer />
          <EuiTitle size="xxs">
            <h4>
              {t("pool_page.user_balance", { count: userLpStats.length })}
            </h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <StatList listItems={userLpStats} />
          <EuiSpacer />
          {!poolSpec.isStakingPool && (
            <>
              <EuiTitle size="xxs">
                <h4>{t("pool_page.pool_info")}</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <StatList listItems={poolInfoStats} />
            </>
          )}
          {getTokenDetailsForEcosystem(lpToken, EcosystemId.Ethereum) !==
            null && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => {
                showRegisterEthereumTokenPrompt(lpToken).catch(console.error);
              }}
              iconType={ETHEREUM_SVG}
            >
              {t("pool_page.add_lp_token_to_metamask")}
            </EuiButtonEmpty>
          )}
          {getTokenDetailsForEcosystem(lpToken, EcosystemId.Bnb) !== null && (
            <EuiButtonEmpty
              flush="left"
              style={{ width: "fit-content" }}
              onClick={() => {
                showRegisterBnbTokenPrompt(lpToken).catch(console.error);
              }}
              iconType={BNB_SVG}
            >
              {t("pool_page.add_lp_token_to_metamask")}
            </EuiButtonEmpty>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
    </>
  );
};

export default PoolPage;
