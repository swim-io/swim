import {
  EuiBasicTable,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiHideFor,
  EuiIcon,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiShowFor,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTitle,
  RIGHT_ALIGNMENT,
} from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID, TokenProjectId } from "@swim-io/token-projects";
import { deduplicate, filterMap, findOrThrow, sortBy } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";
import { ReactElement, useCallback } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { atomicToCurrencyString, atomicToTvlString } from "../amounts";
import {
  ECOSYSTEMS,
  getPoolTokenEcosystems,
  hasTokenEcosystem,
  isEcosystemEnabled,
} from "../config";
import type { EcosystemId, PoolSpec, TokenConfig } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import {
  usePool,
  usePoolUsdValues,
  useTitle,
  useUserBalance,
  useUserLpBalances,
} from "../hooks";
import { useNavigate } from "react-router-dom";
import { TokenConfigIcon, TokenSearchConfigIcon } from "components/TokenIcon";

import "./PoolsPage2.scss";

type EcosystemSelectType = EcosystemId | "all";
type TokenProjectSelectType = TokenProjectId | "all";

const ZERO = new Decimal(0);

const PoolsPage = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  useTitle(t("nav.pools"));

  const { tokens } = useEnvironment(selectConfig, shallow);
  const { ecosystems, ecosystemId, setEcosystemId } = useEcosystemFilter();
  const { tokenProjects, tokenProjectId, setTokenProjectId } =
    useTokenProjectFilter();
  const [tvl, setTvl] = useState(ZERO);
  const [poolsByTvl, setPoolsByTvl] = useState<any[]>([]);
  const { filteredPools } = useFilteredPools(tokenProjectId, ecosystemId);
  // const isUnfiltered = tokenProjectId === "all" && ecosystemId === "all";

  useEffect(() => {
    const TVL = filteredPools.reduce(
      (prev, pool) => prev.add(pool.usdValue),
      new Decimal(0),
    );
    const poolsByTvl = [...filteredPools].sort((a, b) => {
      if (a.usdValue.gt(b.usdValue)) return -1;
      if (a.usdValue.lt(b.usdValue)) return 1;
      return 0;
    });
    setTvl(TVL);
    setPoolsByTvl(poolsByTvl);
  }, []);

  const poolTokens: ReadonlyRecord<PoolSpec["id"], readonly TokenConfig[]> =
    filteredPools.reduce(
      (accumulator, { poolSpec }) => ({
        ...accumulator,
        [poolSpec.id]: poolSpec.tokens.map((id) =>
          findOrThrow(tokens, (tokenConfig) => tokenConfig.id === id),
        ),
      }),
      {},
    );

  const selectTokenOptions = useMemo(
    () => [
      { inputDisplay: t("pools_page.all_tokens"), value: "all", icon: null },
      ...tokenProjects.map((project) => ({
        value: project.id,
        inputDisplay: (
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            responsive={false}
          >
            <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
              <EuiIcon
                type={project.icon}
                size="m"
                title={project.displayName}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText>{project.symbol}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
        icon: null,
      })),
    ],
    [t, tokenProjects],
  );

  const selectEcosystemOptions = useMemo(() => {
    return [
      { inputDisplay: t("pools_page.all_chains"), value: "all", icon: null },
      ...ecosystems.map((ecosystem) => ({
        value: ecosystem.id,
        inputDisplay: (
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            responsive={false}
          >
            <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
              <EuiIcon
                type={ecosystem.logo}
                size="m"
                title={ecosystem.displayName}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText>{ecosystem.displayName}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
        icon: null,
      })),
    ];
  }, [ecosystems, t]);

  const getUserAllocation = useCallback((poolSpec: PoolSpec) => {
    const pool = usePool(poolSpec.id);
    const { lpToken, userLpTokenAccount } = usePool(poolSpec.id);
    const userLpBalances = useUserLpBalances(lpToken, userLpTokenAccount);
    const userAmounts = userLpBalances[poolSpec.ecosystem];

    const userAvailableAmounts = pool.tokens
      .map((token) => useUserBalance(token, token.nativeEcosystemId))
      .filter((balance) => balance)
      .map((value) => (value ? value : new Decimal(0)));
    const allocation = userAmounts
      ? userAmounts.toFormattedHumanString(poolSpec.ecosystem)
      : null;
    console.log("state", pool, poolSpec);
    const userAvailableAmount =
      userAvailableAmounts.length > 0
        ? Decimal.sum(...userAvailableAmounts)?.toDecimalPlaces()
        : null;

    return [Number(allocation), userAvailableAmount];
  }, []);

  const renderTokens = useCallback((poolId: string) => {
    return (
      <div className="tokens">
        {poolTokens[poolId].map((token) => (
          <span style={{ margin: 3 }}>
            {poolTokens[poolId].length > 2 ||
            !token.projectId.includes("swim-usd") ? (
              <TokenConfigIcon
                token={token}
                ecosystem={token.nativeEcosystemId}
              />
            ) : !token.isDisabled ? (
              <TokenSearchConfigIcon token={token} />
            ) : null}
          </span>
        ))}
      </div>
    );
  }, []);

  const tablePools = poolsByTvl
    .filter(
      (pool) =>
        !pool.poolSpec.isStakingPool &&
        isEcosystemEnabled(pool.poolSpec.ecosystem),
    )
    .map((pool) => ({
      ...pool.poolSpec,
      total: atomicToCurrencyString(pool.usdValue),
      userAllocation: getUserAllocation(pool.poolSpec), // This breaks
    }));

  const columns = [
    {
      field: "id",
      name: "Token",
      render: renderTokens,
      footer: <b>Totals</b>,
    },
    {
      field: "ecosystem",
      name: "Chain",
      render: () => <span className="chain">Multi</span>,
    },
    {
      field: "total",
      name: "Total Liquidity",
      className: "liquidity",
      sortable: true,
      render: (totalLiquidity: string) => <b>{totalLiquidity}</b>,
      footer: (
        <div>{tvl.isPositive() ? `${atomicToCurrencyString(tvl)}` : "--"}</div>
      ),
    },
    {
      field: "userAllocation",
      name: "Your Liquidity",
      className: "liquidity",
      sortable: true,
      render: (amounts: Array<any>) => (
        <div>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              {amounts[0] ? `$${amounts[0]}` : "-"}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {amounts[1] ? `$${amounts[1]}` : "-"}
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ),
    },
  ];

  const handleNavigation = (id: string) =>
    id ? navigate(`/pools/${id}`) : undefined;

  const getRowProps = (item: { id: string }) => {
    const { id } = item;
    return {
      onClick: () => handleNavigation(item?.id),
      key: `row-${id}`,
      "data-test-subj": `row-${id}`,
    };
  };

  const getCellProps = useCallback(
    (item: { id: string }, column: { field: any }) => {
      const { id } = item;
      const { field } = column;
      return {
        align: field === "ecosystem" ? "center" : "right",
        key: `cell-${id}-${field}`,
        "data-test-subj": `cell-${id}-${field}`,
      };
    },
    [],
  );

  const content = (
    <EuiBasicTable
      items={tablePools}
      isExpandable={true}
      responsive={true}
      columns={columns}
      // sorting={sorting}
      rowProps={getRowProps}
      cellProps={getCellProps}
    />
  );

  const filters = (
    <EuiFlexItem grow={false}>
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiFormRow label={t("glossary.crypto_token")}>
            <EuiSuperSelect
              options={selectTokenOptions}
              valueOfSelected={tokenProjectId}
              onChange={(value) =>
                setTokenProjectId(value as TokenProjectSelectType)
              }
              hasDividers
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFormRow label={t("glossary.chain_protocol")}>
            <EuiSuperSelect
              options={selectEcosystemOptions}
              valueOfSelected={ecosystemId}
              onChange={(value) => setEcosystemId(value as EcosystemSelectType)}
              hasDividers
              style={{
                minWidth: 160,
              }}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  );

  return (
    <EuiPage className="poolsPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiFlexGroup
              alignItems="center"
              justifyContent="spaceBetween"
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>{t("nav.pools")}</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>
                  <p>
                    <b>
                      {`TVL: ${
                        tvl.isPositive() ? atomicToTvlString(tvl) : "--"
                      }`}
                    </b>
                  </p>
                </EuiText>
              </EuiFlexItem>
              <EuiHideFor sizes={["xs"]}>{filters}</EuiHideFor>
            </EuiFlexGroup>

            <EuiShowFor sizes={["xs"]}>
              <EuiSpacer />
              <EuiFlexGroup>{filters}</EuiFlexGroup>
            </EuiShowFor>
            <EuiSpacer size="xxl" />
            {content}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default PoolsPage;

function useEcosystemFilter() {
  const { env } = useEnvironment();
  const { pools } = useEnvironment(selectConfig, shallow);
  const [ecosystemId, setEcosystemId] = useState<EcosystemSelectType>("all");

  const ecosystems = useMemo(
    () =>
      sortBy(
        deduplicate(
          ({ id }) => id,
          pools.flatMap((pool) => getPoolTokenEcosystems(pool, env)),
        ),
        "displayName",
      ),
    [pools, env],
  );

  useEffect(() => {
    if (
      ecosystemId !== "all" &&
      !ecosystems.find((ecosystem) => ecosystem.id === ecosystemId)
    )
      setEcosystemId("all");
  }, [ecosystemId, ecosystems?.length]);

  return {
    ecosystems,
    ecosystemId,
    setEcosystemId,
  };
}

function useTokenProjectFilter() {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const [tokenProjectId, setTokenProjectId] =
    useState<TokenProjectSelectType>("all");

  const tokenProjects = useMemo(
    () =>
      sortBy(
        deduplicate(
          (project) => project.id,
          tokens
            .map((token) => TOKEN_PROJECTS_BY_ID[token.projectId])
            .filter((project) => project.symbol !== "SWIM" && !project.isLp),
        ),
        "displayName",
        (value) => (typeof value === "string" ? value.toLowerCase() : value),
      ),
    [tokens],
  );

  useEffect(() => {
    if (
      tokenProjectId !== "all" &&
      !tokenProjects.find((project) => project.id === tokenProjectId)
    )
      setTokenProjectId("all");
  }, [tokens, tokenProjectId, tokenProjects]);

  return {
    tokenProjects,
    tokenProjectId,
    setTokenProjectId,
  };
}

function useFilteredPools(
  tokenProjectId: TokenProjectSelectType,
  ecosystemId: EcosystemSelectType,
) {
  const { env } = useEnvironment();
  const { pools, tokens } = useEnvironment(selectConfig, shallow);

  const poolUsdValues = usePoolUsdValues(pools);
  const poolsWithUsdValues = pools.map((poolSpec: PoolSpec, i: number) => ({
    poolSpec,
    usdValue: poolUsdValues[i],
  }));

  const projectsPerPool: ReadonlyRecord<
    PoolSpec["id"],
    readonly TokenProjectId[]
  > = useMemo(() => {
    return pools.reduce(
      (accumulator, pool) => ({
        ...accumulator,
        [pool.id]: deduplicate(
          (id) => id,
          pool.tokens
            .map((tokenId) =>
              findOrThrow(tokens, (token) => token.id === tokenId),
            )
            .flatMap((token) => token.projectId),
        ),
      }),
      {},
    );
  }, [pools, tokens]);

  const filteredPools = poolsWithUsdValues
    .filter(({ poolSpec }) => {
      if (tokenProjectId === "all") return true;
      return projectsPerPool[poolSpec.id].includes(tokenProjectId);
    })
    .filter(({ poolSpec }) => {
      if (ecosystemId === "all") return true;
      return hasTokenEcosystem(poolSpec, env, ecosystemId);
    });

  return {
    poolsWithUsdValues,
    filteredPools,
  };
}
