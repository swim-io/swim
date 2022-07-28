import type { TokenProject } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import AUSD_SVG from "./images/ausd";
import BUSD_SVG from "./images/busd";
import GMT_SVG from "./images/gmt";
import GST_SVG from "./images/gst";
import LP_ACALA_AUSD_SVG from "./images/lp_acala_ausd";
import LP_AURORA_USDC_SVG from "./images/lp_aurora_usdc";
import LP_AURORA_USDT_SVG from "./images/lp_aurora_usdt";
import LP_AURORA_USN_SVG from "./images/lp_aurora_usn";
import LP_AVALANCHE_USDC_SVG from "./images/lp_avalanche_usdc";
import LP_AVALANCHE_USDT_SVG from "./images/lp_avalanche_usdt";
import LP_FANTOM_USDC_SVG from "./images/lp_fantom_usdc";
import LP_GMT_SVG from "./images/lp_gmt";
import LP_GST_SVG from "./images/lp_gst";
import LP_KARURA_AUSD_SVG from "./images/lp_karura_ausd";
import LP_KARURA_USDT_SVG from "./images/lp_karura_usdt";
import LP_POLYGON_USDC_SVG from "./images/lp_polygon_usdc";
import LP_POLYGON_USDT_SVG from "./images/lp_polygon_usdt";
import SWIM_TOKEN_SVG from "./images/swim";
import SWIM_USD_SVG from "./images/swim_usd";
import USDC_SVG from "./images/usdc";
import USDT_SVG from "./images/usdt";
import USN_SVG from "./images/usn";
import XSWIM_TOKEN_SVG from "./images/xswim";

export enum TokenProjectId {
  Ausd = "ausd",
  Busd = "busd",
  Gmt = "gmt",
  Gst = "gst",
  Swim = "swim",
  SwimAcalaAusdLp = "swim-acala-ausd-lp",
  SwimAuroraUsdcLp = "swim-aurora-usdc-lp",
  SwimAuroraUsdtLp = "swim-aurora-usdt-lp",
  SwimAuroraUsnLp = "swim-aurora-usn-lp",
  SwimAvalancheUsdcLp = "swim-avalanche-usdc-lp",
  SwimAvalancheUsdtLp = "swim-avalanche-usdt-lp",
  SwimFantomUsdcLp = "swim-fantom-usdc-lp",
  SwimKaruraAusdLp = "swim-karura-ausd-lp",
  SwimKaruraUsdtLp = "swim-karura-usdt-lp",
  SwimPolygonUsdcLp = "swim-polygon-usdc-lp",
  SwimPolygonUsdtLp = "swim-polygon-usdt-lp",
  SwimSolanaGmtBinanceGmtLp = "swim-solana-gmt-binance-gst-lp",
  SwimSolanaGstBinanceGstLp = "swim-solana-gst-binance-gst-lp",
  SwimUsd = "swim-usd",
  Usdc = "usdc",
  Usdt = "usdt",
  Usn = "usn",
  XSwim = "xswim",
}

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
  },
  [TokenProjectId.Usdt]: {
    id: TokenProjectId.Usdt,
    symbol: "USDT",
    displayName: "Tether USD",
    icon: USDT_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectId.Usn]: {
    id: TokenProjectId.Usn,
    symbol: "USN",
    displayName: "USN",
    icon: USN_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectId.Busd]: {
    id: TokenProjectId.Busd,
    symbol: "BUSD",
    displayName: "Binance USD",
    icon: BUSD_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectId.Ausd]: {
    id: TokenProjectId.Ausd,
    symbol: "aUSD",
    displayName: "Acala USD",
    icon: AUSD_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectId.Gst]: {
    id: TokenProjectId.Gst,
    symbol: "GST",
    displayName: "Green Satoshi Token",
    icon: GST_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectId.Gmt]: {
    id: TokenProjectId.Gmt,
    symbol: "GMT",
    displayName: "STEPN",
    icon: GMT_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectId.SwimUsd]: {
    id: TokenProjectId.SwimUsd,
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    isLp: true,
  },
  [TokenProjectId.Swim]: {
    id: TokenProjectId.Swim,
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectId.XSwim]: {
    id: TokenProjectId.XSwim,
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: XSWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAvalancheUsdcLp]: {
    id: TokenProjectId.SwimAvalancheUsdcLp,
    symbol: "SWIM-AVALANCHE-USDC-LP",
    displayName: "Avalanche USDC LP",
    icon: LP_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAvalancheUsdtLp]: {
    id: TokenProjectId.SwimAvalancheUsdtLp,
    symbol: "SWIM-AVALANCHE-USDT-LP",
    displayName: "Avalanche USDT LP",
    icon: LP_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimPolygonUsdcLp]: {
    id: TokenProjectId.SwimPolygonUsdcLp,
    symbol: "SWIM-POLYGON-USDC-LP",
    displayName: "Polygon USDC LP",
    icon: LP_POLYGON_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimPolygonUsdtLp]: {
    id: TokenProjectId.SwimPolygonUsdtLp,
    symbol: "SWIM-POLYGON-USDT-LP",
    displayName: "Polygon USDT LP",
    icon: LP_POLYGON_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimSolanaGstBinanceGstLp]: {
    id: TokenProjectId.SwimSolanaGstBinanceGstLp,
    symbol: "solaGST-binaGST",
    displayName: "Swim Solana GST Binance GST LP",
    icon: LP_GST_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimSolanaGmtBinanceGmtLp]: {
    id: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    symbol: "solaGMT-binaGMT",
    displayName: "Swim Solana GMT Binance GMT LP",
    icon: LP_GMT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAuroraUsdcLp]: {
    id: TokenProjectId.SwimAuroraUsdcLp,
    symbol: "SWIM-AURORA-USDC-LP",
    displayName: "Aurora USDC LP",
    icon: LP_AURORA_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAuroraUsdtLp]: {
    id: TokenProjectId.SwimAuroraUsdtLp,
    symbol: "SWIM-AURORA-USDT-LP",
    displayName: "Aurora USDT LP",
    icon: LP_AURORA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAuroraUsnLp]: {
    id: TokenProjectId.SwimAuroraUsnLp,
    symbol: "SWIM-AURORA-USN-LP",
    displayName: "Aurora USN LP",
    icon: LP_AURORA_USN_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimFantomUsdcLp]: {
    id: TokenProjectId.SwimFantomUsdcLp,
    symbol: "SWIM-FANTOM-USDC-LP",
    displayName: "Fantom USDC LP",
    icon: LP_FANTOM_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimKaruraAusdLp]: {
    id: TokenProjectId.SwimKaruraAusdLp,
    symbol: "SWIM-KARURA-AUSD-LP",
    displayName: "Karura AUSD LP",
    icon: LP_KARURA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimKaruraUsdtLp]: {
    id: TokenProjectId.SwimKaruraUsdtLp,
    symbol: "SWIM-KARURA-USDT-LP",
    displayName: "Karura USDT LP",
    icon: LP_KARURA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimAcalaAusdLp]: {
    id: TokenProjectId.SwimAcalaAusdLp,
    symbol: "SWIM-ACALA-AUSD-LP",
    displayName: "Acala AUSD LP",
    icon: LP_ACALA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
  },
};

export const TOKEN_PROJECTS = Object.values(TOKEN_PROJECTS_BY_ID);
