import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { Fragment, useState } from "react";
import shallow from "zustand/shallow.js";

import { atomicToTvlString, u64ToDecimal } from "../amounts";
import { PoolListItem } from "../components/PoolListItem";
import type { PoolSpec, TokenSpec } from "../config";
import {
  ECOSYSTEM_LIST,
  EcosystemId,
  getSolanaTokenDetails,
  isEcosystemEnabled,
} from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useCoinGeckoPricesQuery, useLiquidityQuery, useTitle } from "../hooks";
import AUSD_SVG from "../images/tokens/ausd.svg";
import SWIM_USD_SVG from "../images/tokens/swim_usd.svg";
import USDC_SVG from "../images/tokens/usdc.svg";
import USDT_SVG from "../images/tokens/usdt.svg";
import USN_SVG from "../images/tokens/usn.svg";
import { deduplicate, filterMap, findOrThrow, sortBy } from "../utils";

const PoolsPage = (): ReactElement => {
  useTitle("Pools");

  const [ecosystemId, setEcosystemId] = useState<EcosystemId | "all">("all");
  const [tokenSymbol, setTokenSymbol] = useState<TokenSpec["symbol"] | "all">(
    "all",
  );

  const { pools, tokens } = useEnvironment(selectConfig, shallow);

  const allPoolTokenAccountAddresses = pools.flatMap((poolSpec) => [
    ...poolSpec.tokenAccounts.values(),
  ]);
  const { data: allPoolTokenAccounts = null } = useLiquidityQuery(
    allPoolTokenAccountAddresses,
  );

  const { data: prices = new Map<string, Decimal | null>(), isLoading } =
    useCoinGeckoPricesQuery();

  const poolTokens: Record<string, readonly TokenSpec[]> = pools.reduce(
    (accumulator, poolSpec) => {
      return {
        ...accumulator,
        [poolSpec.id]: [...poolSpec.tokenAccounts.keys()].map((id) =>
          findOrThrow(tokens, (tokenSpec) => tokenSpec.id === id),
        ),
      };
    },
    {},
  );

  const getPoolUsdTotal = (poolSpec: PoolSpec) => {
    const tokenSpecs = poolTokens[poolSpec.id];

    if (
      tokenSpecs.every(
        (tokenSpec) => tokenSpec.isStablecoin || !!prices.get(tokenSpec.id),
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
        const price = tokenSpec.isStablecoin
          ? new Decimal(1)
          : prices.get(tokenSpec.id) ?? new Decimal(1);
        return prev.add(humanAmount.mul(price));
      }, new Decimal(0));
    } else {
      return new Decimal(-1); // loading
    }
  };

  const poolUsdTotals: Record<string, Decimal> = pools.reduce(
    (accumulator, poolSpec) => ({
      ...accumulator,
      [poolSpec.id]: getPoolUsdTotal(poolSpec),
    }),
    {},
  );

  const tvl = Object.values(poolUsdTotals).reduce(
    (prev, current) => prev.add(current),
    new Decimal(0),
  );

  const selectTokenOptions = sortBy(
    deduplicate((token) => token.symbol, tokens).filter(
      (token) => !token.id.includes("-lp-") && token.symbol !== "SWIM", // filter out LP tokens -- TODO move this to a TokenSpec flag?
    ),
    "symbol",
  ).map((token) => ({
    value: token.symbol,
    inputDisplay: (
      <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
          <img src={token.icon} alt={token.displayName} width={20} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>{token.symbol}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  }));

  const enabledEcosystems = sortBy(
    ECOSYSTEM_LIST.filter((ecosystem) => isEcosystemEnabled(ecosystem.id)),
    "displayName",
  );

  const selectEcosystemOptions = enabledEcosystems.map((ecosystem) => ({
    value: ecosystem.id,
    inputDisplay: (
      <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false} style={{ marginRight: 20 }}>
          <img src={ecosystem.logo} alt={ecosystem.displayName} width={20} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>{ecosystem.displayName}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  }));

  const filteredPools = pools
    .filter((pool) => {
      if (tokenSymbol === "all") return true;

      // TODO model this somehow better in PoolSpec?
      return !!Array.from(pool.tokenAccounts.keys()).find((key) =>
        key.includes(tokenSymbol.toLowerCase()),
      );
    })
    .filter((pool) => {
      if (ecosystemId === "all") return true;

      return pool.ecosystemIds.includes(ecosystemId);
    });

  const poolsByTvl = [...filteredPools].sort((a, b) => {
    const aUsd = poolUsdTotals[a.id];
    const bUsd = poolUsdTotals[b.id];

    if (aUsd.gt(bUsd)) return -1;
    if (aUsd.lt(bUsd)) return 1;
    return 0;
  });

  const isUnfiltered = tokenSymbol === "all" && ecosystemId === "all";
  const listSpacerSize = "l";

  const content = isLoading ? (
    <EuiFlexGroup justifyContent="center">
      <EuiFlexItem grow={false}>
        <EuiSpacer size={listSpacerSize} />
        <EuiLoadingSpinner size="xl" />
      </EuiFlexItem>
    </EuiFlexGroup>
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
          body="Try changing the network in the upper right corner."
        />
      )}

      {isEcosystemEnabled(EcosystemId.Aurora) ||
        (isUnfiltered && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Aurora USDC Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-aurora-native-usdc",
                  symbol: "USDC",
                  displayName: "USD Coin",
                  icon: USDC_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Aurora,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Aurora USDT Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-aurora-native-usdt",
                  symbol: "USDT",
                  displayName: "Tether USD",
                  icon: USDT_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Aurora,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Aurora USN Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-aurora-native-usn",
                  symbol: "USN",
                  displayName: "USN",
                  icon: USN_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Aurora,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        ))}

      {isEcosystemEnabled(EcosystemId.Fantom) ||
        (isUnfiltered && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Fantom USDC Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-fantom-native-usdc",
                  symbol: "USDC",
                  displayName: "USD Coin",
                  icon: USDC_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Fantom,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        ))}

      {isEcosystemEnabled(EcosystemId.Karura) ||
        (isUnfiltered && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Karura aUSD Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-karura-native-ausd",
                  symbol: "aUSD",
                  displayName: "Karura aUSD",
                  icon: AUSD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Karura,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
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
                  symbol: "USDT",
                  displayName: "Tether USD",
                  icon: USDT_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Karura,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        ))}

      {isEcosystemEnabled(EcosystemId.Acala) ||
        (isUnfiltered && (
          <>
            <EuiSpacer size={listSpacerSize} />

            <PoolListItem
              poolName="Acala aUSD Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-acala-native-ausd",
                  symbol: "aUSD",
                  displayName: "Acala USD",
                  icon: AUSD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Acala,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "mainnet-solana-lp-hexapool",
                  symbol: "swimUSD",
                  displayName: "swimUSD (Swim Hexapool LP)",
                  icon: SWIM_USD_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />
          </>
        ))}
    </>
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
                <EuiFlexGroup alignItems="center">
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
                            tvl.isPositive()
                              ? "$" + atomicToTvlString(tvl)
                              : "--"
                          }`}
                        </b>
                      </p>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup alignItems="center">
                  <EuiFlexItem grow={false}>
                    <EuiFormRow label="Token">
                      <EuiSuperSelect
                        options={[
                          { inputDisplay: "All Tokens", value: "all" },
                          ...selectTokenOptions,
                        ]}
                        valueOfSelected={tokenSymbol}
                        onChange={setTokenSymbol}
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
                        onChange={(value) =>
                          setEcosystemId(value as EcosystemId)
                        }
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
            </EuiFlexGroup>

            <EuiSpacer />
            {content}
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default PoolsPage;
