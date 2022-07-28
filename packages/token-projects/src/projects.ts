import type { TokenProject } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import AUSD_SVG from "~/images/ausd.svg";
import BUSD_SVG from "~/images/busd.svg";
import GMT_SVG from "~/images/gmt.svg";
import GST_SVG from "~/images/gst.svg";
import LP_ACALA_AUSD_SVG from "~/images/lp_acala_ausd.svg";
import LP_AURORA_USDC_SVG from "~/images/lp_aurora_usdc.svg";
import LP_AURORA_USDT_SVG from "~/images/lp_aurora_usdt.svg";
import LP_AURORA_USN_SVG from "~/images/lp_aurora_usn.svg";
import LP_AVALANCHE_USDC_SVG from "~/images/lp_avalanche_usdc.svg";
import LP_AVALANCHE_USDT_SVG from "~/images/lp_avalanche_usdt.svg";
import LP_FANTOM_USDC_SVG from "~/images/lp_fantom_usdc.svg";
import LP_GMT_SVG from "~/images/lp_gmt.svg";
import LP_GST_SVG from "~/images/lp_gst.svg";
import LP_KARURA_AUSD_SVG from "~/images/lp_karura_ausd.svg";
import LP_KARURA_USDT_SVG from "~/images/lp_karura_usdt.svg";
import LP_POLYGON_USDC_SVG from "~/images/lp_polygon_usdc.svg";
import LP_POLYGON_USDT_SVG from "~/images/lp_polygon_usdt.svg";
import SWIM_TOKEN_SVG from "~/images/swim.svg";
import SWIM_USD_SVG from "~/images/swim_usd.svg";
import USDC_SVG from "~/images/usdc.svg";
import USDT_SVG from "~/images/usdt.svg";
import USN_SVG from "~/images/usn.svg";
import XSWIM_TOKEN_SVG from "~/images/xswim.svg";

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
  // V2
  SwimLpSolanaUsdcUsdt = "swim-lp-solana-usdc-usdt",
  SwimLpEthereumUsdcUsdt = "swim-lp-ethereum-usdc-usdt",
  SwimLpBnbBusdUsdt = "swim-lp-bnb-busd-usdt",
  SwimLpAvalancheUsdcUsdt = "swim-lp-avalanche-usdc-usdt",
  SwimLpPolygonUsdcUsdt = "swim-lp-polygon-usdc-usdt",
  SwimLpAuroraUsdcUsdt = "swim-lp-aurora-usdc-usdt",
  SwimLpAuroraUsn = "swim-lp-aurora-usn",
  SwimLpFantomUsdc = "swim-lp-fantom-usdc",
  SwimLpKaruraUsdt = "swim-lp-karura-usdt",
  SwimLpKaruraAusd = "swim-lp-karura-ausd",
  SwimLpAcalaAusd = "swim-lp-acala-ausd",
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
  // V2
  // TODO: Reassign swimUSD to this token
  [TokenProjectId.SwimLpSolanaUsdcUsdt]: {
    id: TokenProjectId.SwimLpSolanaUsdcUsdt,
    symbol: "swimUSDv2", // TODO: update
    displayName: "swimUSD (v2)", // TODO: update
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: true,
    isLp: true,
  },
  [TokenProjectId.SwimLpEthereumUsdcUsdt]: {
    id: TokenProjectId.SwimLpEthereumUsdcUsdt,
    symbol: "SWIM-LP-ETHEREUM-USDC-USDT",
    displayName: "Ethereum USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpBnbBusdUsdt]: {
    id: TokenProjectId.SwimLpBnbBusdUsdt,
    symbol: "SWIM-LP-BNB-BUSD-USDT",
    displayName: "BNB BUSD/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpAvalancheUsdcUsdt]: {
    id: TokenProjectId.SwimLpAvalancheUsdcUsdt,
    symbol: "SWIM-LP-AVALANCHE-USDC-USDT",
    displayName: "Avalanche USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpPolygonUsdcUsdt]: {
    id: TokenProjectId.SwimLpPolygonUsdcUsdt,
    symbol: "SWIM-LP-POLYGON-USDC-USDT",
    displayName: "Polygon USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpAuroraUsdcUsdt]: {
    id: TokenProjectId.SwimLpAuroraUsdcUsdt,
    symbol: "SWIM-LP-AURORA-USDC-USDT",
    displayName: "Aurora USDC/USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpAuroraUsn]: {
    id: TokenProjectId.SwimLpAuroraUsn,
    symbol: "SWIM-LP-AURORA-USN",
    displayName: "Aurora USN Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpFantomUsdc]: {
    id: TokenProjectId.SwimLpFantomUsdc,
    symbol: "SWIM-LP-FANTOM-USDC",
    displayName: "Fantom USDC Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpKaruraUsdt]: {
    id: TokenProjectId.SwimLpKaruraUsdt,
    symbol: "SWIM-LP-KARURA-USDT",
    displayName: "Karura USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpKaruraAusd]: {
    id: TokenProjectId.SwimLpKaruraAusd,
    symbol: "SWIM-LP-KARURA-AUSD",
    displayName: "Karura AUSD Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectId.SwimLpAcalaAusd]: {
    id: TokenProjectId.SwimLpAcalaAusd,
    symbol: "SWIM-LP-ACALA-AUSD",
    displayName: "Acala AUSD Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
  },
};

export const TOKEN_PROJECTS = Object.values(TOKEN_PROJECTS_BY_ID);
