import type { ReadonlyRecord } from "@swim-io/utils";

import AUSD_SVG from "./images/ausd";
import BUSD_SVG from "./images/busd";
import GMT_SVG from "./images/gmt";
import GST_SVG from "./images/gst";
import LP_ACALA_AUSD_SVG from "./images/lp_acala_ausd";
import LP_FANTOM_USDC_SVG from "./images/lp_fantom_usdc";
import LP_KARURA_AUSD_SVG from "./images/lp_karura_ausd";
import LP_KARURA_USDT_SVG from "./images/lp_karura_usdt";
import SWIM_USD_SVG from "./images/swim_usd";
import USDC_SVG from "./images/usdc";
import USDT_SVG from "./images/usdt";

export enum TokenProjectId {
  Ausd = "ausd",
  Busd = "busd",
  Gmt = "gmt",
  Gst = "gst",
  SwimUsd = "swim-usd",
  Usdc = "usdc",
  Usdt = "usdt",
  SwimLpEthereumUsdcUsdt = "swim-lp-ethereum-usdc-usdt",
  SwimLpBnbBusdUsdt = "swim-lp-bnb-busd-usdt",
  SwimLpAvalancheUsdcUsdt = "swim-lp-avalanche-usdc-usdt",
  SwimLpPolygonUsdcUsdt = "swim-lp-polygon-usdc-usdt",
  SwimLpAuroraUsdcUsdt = "swim-lp-aurora-usdc-usdt",
  SwimLpFantomUsdc = "swim-lp-fantom-usdc",
  SwimLpKaruraUsdt = "swim-lp-karura-usdt",
  SwimLpKaruraAusd = "swim-lp-karura-ausd",
  SwimLpAcalaAusd = "swim-lp-acala-ausd",
}

export const isTokenProjectId = (id: string): id is TokenProjectId => {
  return Object.values(TokenProjectId).includes(id as TokenProjectId);
};

/**
 * A token project incorporates one or more tokens. For example USDT has deployments on several
 * different chains, which are technically independent tokens but share many features. Note that
 * these are not wrapped versions of some single original token.
 */
export type TokenProject = {
  readonly id: TokenProjectId;
  readonly symbol: string;
  readonly displayName: string;
  /** absolute url or base64 of an icon for the token */
  readonly icon: string;
  readonly isStablecoin: boolean;
} & (
  | {
      readonly isLp: boolean;
      readonly tokenNumber: number;
    }
  | {
      readonly isLp: true;
      readonly tokenNumber: null;
    }
);

export const TOKEN_PROJECTS_BY_ID: ReadonlyRecord<
  TokenProjectId,
  TokenProject
> = {
  [TokenProjectId.Usdc]: {
    id: TokenProjectId.Usdc,
    symbol: "USDC",
    displayName: "USD Coin",
    icon: USDC_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0100,
  },
  [TokenProjectId.Usdt]: {
    id: TokenProjectId.Usdt,
    symbol: "USDT",
    displayName: "Tether USD",
    icon: USDT_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0101,
  },
  [TokenProjectId.Busd]: {
    id: TokenProjectId.Busd,
    symbol: "BUSD",
    displayName: "Binance USD",
    icon: BUSD_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0103,
  },
  [TokenProjectId.Ausd]: {
    id: TokenProjectId.Ausd,
    symbol: "aUSD",
    displayName: "Acala USD",
    icon: AUSD_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0104,
  },
  [TokenProjectId.Gst]: {
    id: TokenProjectId.Gst,
    symbol: "GST",
    displayName: "Green Satoshi Token",
    icon: GST_SVG,
    isStablecoin: false,
    isLp: false,
    tokenNumber: 0x8000,
  },
  [TokenProjectId.Gmt]: {
    id: TokenProjectId.Gmt,
    symbol: "GMT",
    displayName: "STEPN",
    icon: GMT_SVG,
    isStablecoin: false,
    isLp: false,
    tokenNumber: 0x8001,
  },
  [TokenProjectId.SwimUsd]: {
    id: TokenProjectId.SwimUsd,
    symbol: "swimUSDv2", // TODO: update
    displayName: "swimUSD (v2)", // TODO: update
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: true,
    isLp: true,
    tokenNumber: 0x0000,
  },
  [TokenProjectId.SwimLpEthereumUsdcUsdt]: {
    id: TokenProjectId.SwimLpEthereumUsdcUsdt,
    symbol: "SWIM-LP-ETHEREUM-USDC-USDT",
    displayName: "Ethereum USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpBnbBusdUsdt]: {
    id: TokenProjectId.SwimLpBnbBusdUsdt,
    symbol: "SWIM-LP-BNB-BUSD-USDT",
    displayName: "BNB BUSD/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpAvalancheUsdcUsdt]: {
    id: TokenProjectId.SwimLpAvalancheUsdcUsdt,
    symbol: "SWIM-LP-AVALANCHE-USDC-USDT",
    displayName: "Avalanche USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpPolygonUsdcUsdt]: {
    id: TokenProjectId.SwimLpPolygonUsdcUsdt,
    symbol: "SWIM-LP-POLYGON-USDC-USDT",
    displayName: "Polygon USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpAuroraUsdcUsdt]: {
    id: TokenProjectId.SwimLpAuroraUsdcUsdt,
    symbol: "SWIM-LP-AURORA-USDC-USDT",
    displayName: "Aurora USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpFantomUsdc]: {
    id: TokenProjectId.SwimLpFantomUsdc,
    symbol: "SWIM-LP-FANTOM-USDC",
    displayName: "Fantom USDC Pool LP",
    icon: LP_FANTOM_USDC_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpKaruraUsdt]: {
    id: TokenProjectId.SwimLpKaruraUsdt,
    symbol: "SWIM-LP-KARURA-USDT",
    displayName: "Karura USDT Pool LP",
    icon: LP_KARURA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpKaruraAusd]: {
    id: TokenProjectId.SwimLpKaruraAusd,
    symbol: "SWIM-LP-KARURA-AUSD",
    displayName: "Karura AUSD Pool LP",
    icon: LP_KARURA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpAcalaAusd]: {
    id: TokenProjectId.SwimLpAcalaAusd,
    symbol: "SWIM-LP-ACALA-AUSD",
    displayName: "Acala AUSD Pool LP",
    icon: LP_ACALA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
};

export const TOKEN_PROJECTS = Object.values(TOKEN_PROJECTS_BY_ID);
