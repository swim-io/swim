import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiHideFor,
  EuiIcon,
  EuiLoadingContent,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPanel,
  EuiShowFor,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { Fragment, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import { atomicToTvlString, u64ToDecimal } from "../amounts";
import { PoolListItem } from "../components/PoolListItem";
import type { PoolSpec, SolanaPoolSpec, TokenSpec } from "../config";
import {
  EcosystemId,
  PROJECTS,
  TokenProjectId,
  getPoolTokenEcosystems,
  getSolanaTokenDetails,
  hasTokenEcosystem,
  isEcosystemEnabled,
} from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useCoinGeckoPricesQuery, useLiquidityQuery, useTitle } from "../hooks";
import { isSolanaPool } from "../models";
import { deduplicate, filterMap, findOrThrow, sortBy } from "../utils";
import type { ReadonlyRecord } from "../utils";

type EcosystemSelectType = EcosystemId | "all";
type TokenProjectSelectType = TokenProjectId | "all";

const PoolsPage = (): ReactElement => {
  useTitle("Pools");

  const [ecosystemId, setEcosystemId] = useState<EcosystemSelectType>("all");
  const [tokenProjectId, setTokenProjectId] =
    useState<TokenProjectSelectType>("all");

  const { env } = useEnvironment();
  const { pools, tokens } = useEnvironment(selectConfig, shallow);

  const solanaPools = pools.filter(isSolanaPool);

  const allPoolTokenAccountAddresses = solanaPools.flatMap((poolSpec) => [
    ...poolSpec.tokenAccounts.values(),
  ]);
  const { data: allPoolTokenAccounts = null } = useLiquidityQuery(
    allPoolTokenAccountAddresses,
  );

  const {
    data: prices = new Map<TokenSpec["id"], Decimal | null>(),
    isLoading,
  } = useCoinGeckoPricesQuery();

  const poolTokens: ReadonlyRecord<PoolSpec["id"], readonly TokenSpec[]> =
    solanaPools.reduce(
      (accumulator, poolSpec) => ({
        ...accumulator,
        [poolSpec.id]: poolSpec.tokens.map((id) =>
          findOrThrow(tokens, (tokenSpec) => tokenSpec.id === id),
        ),
      }),
      {},
    );

  const getPoolUsdTotal = (poolSpec: SolanaPoolSpec) => {
    const tokenSpecs = poolTokens[poolSpec.id];

    if (
      tokenSpecs.every(
        (tokenSpec) =>
          tokenSpec.project.isStablecoin || !!prices.get(tokenSpec.id),
      )
    ) {
      if (allPoolTokenAccounts === null) {
        return new Decimal(-1); // loading
      }
      const poolTokenAccountAddresses = [...poolSpec.tokenAccounts.values()];
      const poolTokenAccounts = allPoolTokenAccounts.filter(
        (tokenAccount): tokenAccount is TokenAccount =>
          tokenAccount !== null &&
          poolTokenAccountAddresses.includes(tokenAccount.address.toBase58()),
      );

      if (poolTokenAccounts.length === 0) {
        return new Decimal(-1); // loading
      }

      return poolTokenAccounts.reduce((prev, current, j) => {
        const tokenSpec = tokenSpecs[j];
        const solanaDetails = getSolanaTokenDetails(tokenSpec);
        const humanAmount = u64ToDecimal(current.amount).div(
          new Decimal(10).pow(solanaDetails.decimals),
        );
        const price = tokenSpec.project.isStablecoin
          ? new Decimal(1)
          : prices.get(tokenSpec.id) ?? new Decimal(1);
        return prev.add(humanAmount.mul(price));
      }, new Decimal(0));
    } else {
      return new Decimal(-1); // loading
    }
  };

  const poolUsdTotals: ReadonlyRecord<PoolSpec["id"], Decimal> =
    solanaPools.reduce(
      (accumulator, poolSpec) => ({
        ...accumulator,
        [poolSpec.id]: getPoolUsdTotal(poolSpec),
      }),
      {},
    );

  const selectTokenOptions = useMemo(
    () =>
      sortBy(
        deduplicate(
          (project) => project.id,
          tokens
            .map((token) => token.project)
            .filter((project) => project.symbol !== "SWIM" && !project.isLP),
        ),
        "displayName",
        (value) => (typeof value === "string" ? value.toLowerCase() : value),
      ).map((project) => ({
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
      })),
    [tokens],
  );

  const selectEcosystemOptions = useMemo(() => {
    const ecosystems = sortBy(
      deduplicate(
        ({ id }) => id,
        pools.flatMap((pool) => getPoolTokenEcosystems(pool, env)),
      ),
      "displayName",
    );

    return ecosystems.map((ecosystem) => ({
      value: ecosystem.id,
      inputDisplay: (
        <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
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
    }));
  }, [env, pools]);

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
            .flatMap((token) => token.project.id),
        ),
      }),
      {},
    );
  }, [pools, tokens]);

  const filteredPools = solanaPools
    .filter((pool) => {
      if (tokenProjectId === "all") return true;
      return projectsPerPool[pool.id].includes(tokenProjectId);
    })
    .filter((pool) => {
      if (ecosystemId === "all") return true;
      return hasTokenEcosystem(pool, env, ecosystemId);
    });

  const tvl = filteredPools.reduce(
    (prev, pool) => prev.add(poolUsdTotals[pool.id]),
    new Decimal(0),
  );

  const poolsByTvl = [...filteredPools].sort((a, b) => {
    const aUsd = poolUsdTotals[a.id];
    const bUsd = poolUsdTotals[b.id];

    if (aUsd.gt(bUsd)) return -1;
    if (aUsd.lt(bUsd)) return 1;
    return 0;
  });

  const isUnfiltered = tokenProjectId === "all" && ecosystemId === "all";
  const listSpacerSize = "l";

  const content = isLoading ? (
    <>
      {solanaPools.map((pool) => (
        <Fragment key={pool.id}>
          <EuiSpacer size={listSpacerSize} />
          <EuiPanel>
            <EuiLoadingContent lines={3} />
          </EuiPanel>
        </Fragment>
      ))}
    </>
  ) : (
    <>
      {poolsByTvl.length > 0 ? (
        filterMap(
          (pool: PoolSpec) => !pool.isStakingPool,
          (pool, i) => (
            <Fragment key={pool.id}>
              <PoolListItem
                poolId={pool.id}
                poolName={pool.displayName}
                tokenSpecs={poolTokens[pool.id]}
                totalUsd={poolUsdTotals[pool.id]}
                isStableSwap={pool.isStableSwap}
              />
              <EuiSpacer size={listSpacerSize} />
            </Fragment>
          ),
          poolsByTvl,
        )
      ) : (
        <EuiEmptyPrompt
          iconType="alert"
          title={<h2>No pools found</h2>}
          titleSize="xs"
          body="Try adjusting your filter. (Are you on the right network?)"
        />
      )}

      {(isUnfiltered || ecosystemId === EcosystemId.Aurora) && (
        <>
          <EuiSpacer size={listSpacerSize} />

          <PoolListItem
            poolName="Aurora USN Meta-Pool"
            betaBadgeLabel="Coming Soon"
            tokenSpecs={[
              {
                id: "placeholder-aurora-native-usn",
                project: PROJECTS[TokenProjectId.Usn],
                nativeEcosystem: EcosystemId.Aurora,
                detailsByEcosystem: new Map(),
              },
              {
                id: "mainnet-solana-lp-hexapool",
                project: PROJECTS[TokenProjectId.SwimUsd],
                nativeEcosystem: EcosystemId.Solana,
                detailsByEcosystem: new Map(),
              },
            ]}
          />
        </>
      )}

      {!isEcosystemEnabled(EcosystemId.Karura) &&
        (isUnfiltered || ecosystemId === EcosystemId.Karura) && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Karura aUSD Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-karura-native-ausd",
                  project: PROJECTS[TokenProjectId.Ausd],
                  nativeEcosystem: EcosystemId.Karura,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  project: PROJECTS[TokenProjectId.SwimUsd],
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Karura USDT Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-karura-native-usdt",
                  project: PROJECTS[TokenProjectId.Usdt],
                  nativeEcosystem: EcosystemId.Karura,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  project: PROJECTS[TokenProjectId.SwimUsd],
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        )}

      {!isEcosystemEnabled(EcosystemId.Acala) &&
        (isUnfiltered || ecosystemId === EcosystemId.Acala) && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Acala aUSD Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-acala-native-ausd",
                  project: PROJECTS[TokenProjectId.Ausd],
                  nativeEcosystem: EcosystemId.Acala,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  project: PROJECTS[TokenProjectId.SwimUsd],
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        )}
    </>
  );

  const filters = (
    <EuiFlexItem grow={false}>
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiFormRow label="Token">
            <EuiSuperSelect
              options={[
                { inputDisplay: "All Tokens", value: "all" },
                ...selectTokenOptions,
              ]}
              valueOfSelected={tokenProjectId}
              onChange={(value) =>
                setTokenProjectId(value as TokenProjectSelectType)
              }
              itemLayoutAlign="top"
              hasDividers
              style={{
                minWidth: 140,
              }}
            />
          </EuiFormRow>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFormRow label="Chain">
            <EuiSuperSelect
              options={[
                { inputDisplay: "All Chains", value: "all" },
                ...selectEcosystemOptions,
              ]}
              valueOfSelected={ecosystemId}
              onChange={(value) => setEcosystemId(value as EcosystemSelectType)}
              itemLayoutAlign="top"
              hasDividers
              style={{
                minWidth: 180,
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
                  <h2>Pools</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>
                  <p>
                    <b>
                      {`TVL: ${
                        tvl.isPositive() ? "$" + atomicToTvlString(tvl) : "--"
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

            <EuiSpacer />
            {content}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default PoolsPage;
