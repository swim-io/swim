import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { Fragment } from "react";
import shallow from "zustand/shallow.js";

import { atomicToTvlString, u64ToDecimal } from "../amounts";
import { PoolListItem } from "../components/PoolListItem";
import type { PoolSpec } from "../config";
import { EcosystemId, getSolanaTokenDetails } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { useCoinGeckoPricesQuery, useLiquidityQuery, useTitle } from "../hooks";
import AUSD_SVG from "../images/tokens/ausd.svg";
import BTC_SVG from "../images/tokens/btc.svg";
import SWIM_USD_SVG from "../images/tokens/swim_usd.svg";
import USDC_SVG from "../images/tokens/usdc.svg";
import USDT_SVG from "../images/tokens/usdt.svg";
import USN_SVG from "../images/tokens/usn.svg";
import WBTC_SVG from "../images/tokens/wbtc.svg";
import { filterMap, findOrThrow } from "../utils";

const PoolsPage = (): ReactElement => {
  useTitle("Pools");
  const { pools, tokens } = useEnvironment(selectConfig, shallow);

  const allPoolTokenAccountAddresses = pools.flatMap((poolSpec) => [
    ...poolSpec.tokenAccounts.values(),
  ]);
  const { data: allPoolTokenAccounts = null } = useLiquidityQuery(
    allPoolTokenAccountAddresses,
  );
  const { data: prices = new Map<string, Decimal | null>() } =
    useCoinGeckoPricesQuery();
  const poolTokens = pools.map((poolSpec) =>
    [...poolSpec.tokenAccounts.keys()].map((id) =>
      findOrThrow(tokens, (tokenSpec) => tokenSpec.id === id),
    ),
  );

  const poolUsdTotals = pools.map((poolSpec, i) => {
    const tokenSpecs = poolTokens[i];

    if (
      tokenSpecs.every(
        (tokenSpec) => tokenSpec.isStablecoin || !!prices.get(tokenSpec.id),
      )
    ) {
      if (allPoolTokenAccounts === null) {
        return new Decimal(-1); // loading
      }
      const poolTokenAccountAddresses = [...poolSpec.tokenAccounts.values()];
      const poolTokenAccounts = allPoolTokenAccounts.filter((tokenAccount) =>
        poolTokenAccountAddresses.includes(tokenAccount.address.toBase58()),
      );

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
    }
    return null;
  });

  const tvl =
    poolUsdTotals.reduce((prev, current) => {
      return (prev ?? new Decimal(0)).add(current ?? new Decimal(0));
    }) ?? new Decimal(0);

  return (
    <EuiPage className="poolsPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
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
            </EuiFlexGroup>

            <EuiSpacer />

            {pools.length > 0 ? (
              filterMap(
                (pool: PoolSpec) => !pool.isStakingPool,
                (pool, i) => (
                  <Fragment key={pool.id}>
                    <PoolListItem
                      poolId={pool.id}
                      poolName={pool.displayName}
                      tokenSpecs={poolTokens[i]}
                      totalUsd={poolUsdTotals[i]}
                      isStableSwap={pool.isStableSwap}
                    />
                    <EuiSpacer size="xxl" />
                  </Fragment>
                ),
                pools,
              )
            ) : (
              <EuiEmptyPrompt
                iconType="alert"
                title={<h2>No pools found</h2>}
                titleSize="xs"
                body="Try changing the network in the upper right corner."
              />
            )}

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

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

            <EuiSpacer size="xxl" />

            <PoolListItem
              poolName="BTC Tri-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-btc",
                  symbol: "ETH",
                  displayName: "Bitcoin",
                  icon: BTC_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-ethereum-native-wbtc",
                  symbol: "WBTC",
                  displayName: "Wrapped Bitcoin",
                  icon: WBTC_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Ethereum,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-bsc-native-btcb",
                  symbol: "BTCB",
                  displayName: "BTCB",
                  icon: BTC_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Bsc,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size="xxl" />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default PoolsPage;
