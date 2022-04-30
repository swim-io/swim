import {
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import Decimal from "decimal.js";
import type { ReactElement } from "react";
import { Fragment } from "react";

import { u64ToDecimal } from "../amounts";
import { PoolListItem } from "../components/PoolListItem";
import type { PoolSpec } from "../config";
import { EcosystemId, getSolanaTokenDetails } from "../config";
import { useConfig } from "../contexts";
import { useLiquidityQuery, useTitle } from "../hooks";
import BTC_SVG from "../images/btc.svg";
import SWIM_SVG from "../images/swim_logo.svg";
import USDC_SVG from "../images/usdc.svg";
import USDT_SVG from "../images/usdt.svg";
import UST_SVG from "../images/ust.svg";
import WBTC_SVG from "../images/wbtc.svg";
import { filterMap, findOrThrow } from "../utils";

const PoolsPage = (): ReactElement => {
  useTitle("Pools");
  const { pools, tokens } = useConfig();

  const allPoolTokenAccountAddresses = pools.flatMap((poolSpec) => [
    ...poolSpec.tokenAccounts.values(),
  ]);
  const { data: allPoolTokenAccounts = null } = useLiquidityQuery(
    allPoolTokenAccountAddresses,
  );
  const poolTokens = pools.map((poolSpec) =>
    [...poolSpec.tokenAccounts.keys()].map((id) =>
      findOrThrow(tokens, (tokenSpec) => tokenSpec.id === id),
    ),
  );

  const poolTotals = pools.map((poolSpec, i) => {
    const tokenSpecs = poolTokens[i];

    let totalUsd: Decimal | null = null; // default: no value
    if (tokenSpecs.every((tokenSpec) => tokenSpec.isStablecoin)) {
      if (allPoolTokenAccounts) {
        const poolTokenAccountAddresses = [...poolSpec.tokenAccounts.values()];
        const poolTokenAccounts = allPoolTokenAccounts.filter((tokenAccount) =>
          poolTokenAccountAddresses.includes(tokenAccount.address.toBase58()),
        );

        totalUsd = poolTokenAccounts.reduce((prev, current, j) => {
          const solanaDetails = getSolanaTokenDetails(tokenSpecs[j]);
          const humanAmount = u64ToDecimal(current.amount).div(
            new Decimal(10).pow(solanaDetails.decimals),
          );
          return prev.add(humanAmount);
        }, new Decimal(0));
      } else {
        totalUsd = new Decimal(-1); // loading
      }
    }

    return totalUsd;
  });

  return (
    <EuiPage className="poolsPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>Pools</h2>
            </EuiTitle>
            <EuiSpacer />

            {pools.length > 0 ? (
              filterMap(
                (pool: PoolSpec) => !pool.isStakingPool,
                (pool, i) => (
                  <Fragment key={pool.id}>
                    <PoolListItem
                      poolId={pool.id}
                      title={pool.displayName}
                      tokenSpecs={poolTokens[i]}
                      totalUsd={poolTotals[i]}
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
              title="BTC Tri-Pool"
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

            <PoolListItem
              title="UST Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-lp_hexapool",
                  symbol: "SWIM_HEXAPOOL_LP",
                  displayName: "swimUSD",
                  icon: SWIM_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-terra-native-ust",
                  symbol: "UST",
                  displayName: "TerraUSD",
                  icon: UST_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Terra,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size="xxl" />

            <PoolListItem
              title="Avalanche USDC Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-lp_hexapool",
                  symbol: "SWIM_HEXAPOOL_LP",
                  displayName: "swimUSD",
                  icon: SWIM_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-avalanche-native-usdc",
                  symbol: "USDC",
                  displayName: "USDC",
                  icon: USDC_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Avalanche,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size="xxl" />

            <PoolListItem
              title="Avalanche USDT Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-lp_hexapool",
                  symbol: "SWIM_HEXAPOOL_LP",
                  displayName: "swimUSD",
                  icon: SWIM_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-avalanche-native-usdt",
                  symbol: "USDT",
                  displayName: "USDT",
                  icon: USDT_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Avalanche,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size="xxl" />

            <PoolListItem
              title="Polygon USDC Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-lp_hexapool",
                  symbol: "SWIM_HEXAPOOL_LP",
                  displayName: "swimUSD",
                  icon: SWIM_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-polygon-native-usdc",
                  symbol: "USDC",
                  displayName: "USDC",
                  icon: USDC_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Polygon,
                  detailsByEcosystem: new Map(),
                },
              ]}
            />

            <EuiSpacer size="xxl" />

            <PoolListItem
              title="Polygon USDT Meta-Pool"
              betaBadgeLabel="Coming Soon"
              tokenSpecs={[
                {
                  id: "placeholder-solana-native-lp_hexapool",
                  symbol: "SWIM_HEXAPOOL_LP",
                  displayName: "swimUSD",
                  icon: SWIM_SVG,
                  isStablecoin: false,
                  nativeEcosystem: EcosystemId.Solana,
                  detailsByEcosystem: new Map(),
                },
                {
                  id: "placeholder-polygon-native-usdt",
                  symbol: "USDT",
                  displayName: "USDT",
                  icon: USDT_SVG,
                  isStablecoin: true,
                  nativeEcosystem: EcosystemId.Polygon,
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
