import {
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
} from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID, TokenProjectId } from "@swim-io/token-projects";
import { deduplicate, filterMap, findOrThrow, sortBy } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import { atomicToTvlString } from "../amounts";
import { PoolListItem } from "../components/PoolListItem";
import {
  getPoolTokenEcosystems,
  hasTokenEcosystem,
  isEcosystemEnabled,
} from "../config";
import type { EcosystemId, PoolSpec, TokenConfig } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { usePoolUsdValues, useTitle } from "../hooks";

type EcosystemSelectType = EcosystemId | "all";
type TokenProjectSelectType = TokenProjectId | "all";

const PoolsPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.pools"));

  const { tokens } = useEnvironment(selectConfig, shallow);
  const { ecosystems, ecosystemId, setEcosystemId } = useEcosystemFilter();
  const { tokenProjects, tokenProjectId, setTokenProjectId } =
    useTokenProjectFilter();
  const { filteredPools, poolsWithUsdValues } = useFilteredPools(
    tokenProjectId,
    ecosystemId,
  );

  const poolTokens: ReadonlyRecord<PoolSpec["id"], readonly TokenConfig[]> =
    poolsWithUsdValues.reduce(
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

  const tvl = filteredPools.reduce(
    (prev, pool) => prev.add(pool.usdValue),
    new Decimal(0),
  );

  const poolsByTvl = [...filteredPools].sort((a, b) => {
    if (a.usdValue.gt(b.usdValue)) return -1;
    if (a.usdValue.lt(b.usdValue)) return 1;
    return 0;
  });

  const isUnfiltered = tokenProjectId === "all" && ecosystemId === "all";
  const listSpacerSize = "l";
  const content = (
    <>
      {poolsByTvl.length > 0 ? (
        filterMap(
          ({ poolSpec }: { readonly poolSpec: PoolSpec }) =>
            !poolSpec.isStakingPool,
          ({ poolSpec, usdValue }, i) => (
            <Fragment key={poolSpec.id}>
              <PoolListItem
                poolName={poolSpec.displayName}
                tokenSpecs={poolTokens[poolSpec.id]}
                totalUsd={usdValue}
                poolSpec={poolSpec}
              />
              <EuiSpacer size={listSpacerSize} />
            </Fragment>
          ),
          poolsByTvl,
        )
      ) : (
        <EuiEmptyPrompt
          iconType="alert"
          title={<h2>{t("general.error_cannot_found_pools")}</h2>}
          titleSize="xs"
          body={t("general.action_on_error_cannot_found_pools")}
        />
      )}

      {(isUnfiltered || ecosystemId === EvmEcosystemId.Aurora) && (
        <>
          <EuiSpacer size={listSpacerSize} />

          <PoolListItem
            poolName="Aurora USN"
            betaBadgeLabel={t("pools_page.coming_soon")}
            tokenSpecs={[
              {
                id: "placeholder-aurora-native-usn",
                projectId: TokenProjectId.Usn,
                nativeEcosystemId: EvmEcosystemId.Aurora,
                nativeDetails: {
                  address: "",
                  decimals: 0,
                },
                wrappedDetails: new Map(),
              },
              {
                id: "mainnet-solana-lp-hexapool",
                projectId: TokenProjectId.SwimUsd,
                nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
                nativeDetails: {
                  address: "",
                  decimals: 0,
                },
                wrappedDetails: new Map(),
              },
            ]}
          />
        </>
      )}

      {!isEcosystemEnabled(EvmEcosystemId.Karura) &&
        (isUnfiltered || ecosystemId === EvmEcosystemId.Karura) && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Karura aUSD"
              betaBadgeLabel={t("pools_page.coming_soon")}
              tokenSpecs={[
                {
                  id: "placeholder-karura-native-ausd",
                  projectId: TokenProjectId.Ausd,
                  nativeEcosystemId: EvmEcosystemId.Karura,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  projectId: TokenProjectId.SwimUsd,
                  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
                },
              ]}
            />

            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Karura USDT"
              betaBadgeLabel={t("pools_page.coming_soon")}
              tokenSpecs={[
                {
                  id: "placeholder-karura-native-usdt",
                  projectId: TokenProjectId.Usdt,
                  nativeEcosystemId: EvmEcosystemId.Karura,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  projectId: TokenProjectId.SwimUsd,
                  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
                },
              ]}
            />
          </>
        )}

      {!isEcosystemEnabled(EvmEcosystemId.Acala) &&
        (isUnfiltered || ecosystemId === EvmEcosystemId.Acala) && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Acala aUSD"
              betaBadgeLabel={t("pools_page.coming_soon")}
              tokenSpecs={[
                {
                  id: "placeholder-acala-native-ausd",
                  projectId: TokenProjectId.Ausd,
                  nativeEcosystemId: EvmEcosystemId.Acala,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  projectId: TokenProjectId.SwimUsd,
                  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
                  nativeDetails: {
                    address: "",
                    decimals: 0,
                  },
                  wrappedDetails: new Map(),
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

            <EuiSpacer />
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
  }, [ecosystemId, ecosystems]);

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
  const poolsWithUsdValues = pools.map((poolSpec, i) => ({
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
