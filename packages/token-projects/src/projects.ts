import type { ReadonlyRecord } from "@swim-io/utils";

import AUSD_SVG from "./images/ausd";
import BUSD_SVG from "./images/busd";
import GMT_SVG from "./images/gmt";
import GST_SVG from "./images/gst";
import LP_ACALA_AUSD_SVG from "./images/lp_acala_ausd";
import LP_AURORA_USDC_SVG from "./images/lp_aurora_usdc";
import LP_AURORA_USDTE_SVG from "./images/lp_aurora_usdte";
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
  SwimAuroraUsdteLp = "swim-aurora-usdte-lp",
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
  Usdte = "usdte",
  Usn = "usn",
  XSwim = "xswim",
  // V2
  SwimLpSolanaUsdcUsdt = "swim-lp-solana-usdc-usdt",
  SwimLpEthereumUsdcUsdt = "swim-lp-ethereum-usdc-usdt",
  SwimLpBnbBusdUsdt = "swim-lp-bnb-busd-usdt",
  SwimLpAvalancheUsdcUsdt = "swim-lp-avalanche-usdc-usdt",
  SwimLpPolygonUsdcUsdt = "swim-lp-polygon-usdc-usdt",
  SwimLpAuroraUsdcUsdte = "swim-lp-aurora-usdc-usdte",
  SwimLpAuroraUsn = "swim-lp-aurora-usn",
  SwimLpFantomUsdc = "swim-lp-fantom-usdc",
  SwimLpKaruraUsdt = "swim-lp-karura-usdt",
  SwimLpKaruraAusd = "swim-lp-karura-ausd",
  SwimLpAcalaAusd = "swim-lp-acala-ausd",
}

/**
 * A token project incorporates one or more tokens. For example USDT has deployments on several
 * different chains, which are technically independent tokens but share many features. Note that
 * these are not wrapped versions of some single original token.
 */
export interface TokenProject {
  readonly id: TokenProjectId;
  readonly symbol: string;
  readonly displayName: string;
  /** URL of an icon for the token */
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly isLp: boolean;
  readonly tokenNumber: number | null;
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
  [TokenProjectId.Usn]: {
    id: TokenProjectId.Usn,
    symbol: "USN",
    displayName: "USN",
    icon: USN_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0102,
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
  [TokenProjectId.Usdte]: {
    id: TokenProjectId.Usdte,
    symbol: "USDT.e",
    displayName: "Tether USD",
    icon: USDT_SVG,
    isStablecoin: true,
    isLp: false,
    tokenNumber: 0x0105,
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
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.Swim]: {
    id: TokenProjectId.Swim,
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: false,
    tokenNumber: null,
  },
  [TokenProjectId.XSwim]: {
    id: TokenProjectId.XSwim,
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: XSWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAvalancheUsdcLp]: {
    id: TokenProjectId.SwimAvalancheUsdcLp,
    symbol: "SWIM-AVALANCHE-USDC-LP",
    displayName: "Avalanche USDC LP",
    icon: LP_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAvalancheUsdtLp]: {
    id: TokenProjectId.SwimAvalancheUsdtLp,
    symbol: "SWIM-AVALANCHE-USDT-LP",
    displayName: "Avalanche USDT LP",
    icon: LP_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimPolygonUsdcLp]: {
    id: TokenProjectId.SwimPolygonUsdcLp,
    symbol: "SWIM-POLYGON-USDC-LP",
    displayName: "Polygon USDC LP",
    icon: LP_POLYGON_USDC_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimPolygonUsdtLp]: {
    id: TokenProjectId.SwimPolygonUsdtLp,
    symbol: "SWIM-POLYGON-USDT-LP",
    displayName: "Polygon USDT LP",
    icon: LP_POLYGON_USDT_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimSolanaGstBinanceGstLp]: {
    id: TokenProjectId.SwimSolanaGstBinanceGstLp,
    symbol: "solaGST-binaGST",
    displayName: "Swim Solana GST Binance GST LP",
    icon: LP_GST_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimSolanaGmtBinanceGmtLp]: {
    id: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    symbol: "solaGMT-binaGMT",
    displayName: "Swim Solana GMT Binance GMT LP",
    icon: LP_GMT_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAuroraUsdcLp]: {
    id: TokenProjectId.SwimAuroraUsdcLp,
    symbol: "SWIM-AURORA-USDC-LP",
    displayName: "Aurora USDC LP",
    icon: LP_AURORA_USDC_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAuroraUsdteLp]: {
    id: TokenProjectId.SwimAuroraUsdteLp,
    symbol: "SWIM-AURORA-USDTE-LP",
    displayName: "Aurora USDT.e LP",
    icon: LP_AURORA_USDTE_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAuroraUsnLp]: {
    id: TokenProjectId.SwimAuroraUsnLp,
    symbol: "SWIM-AURORA-USN-LP",
    displayName: "Aurora USN LP",
    icon: LP_AURORA_USN_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimFantomUsdcLp]: {
    id: TokenProjectId.SwimFantomUsdcLp,
    symbol: "SWIM-FANTOM-USDC-LP",
    displayName: "Fantom USDC LP",
    icon: LP_FANTOM_USDC_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimKaruraAusdLp]: {
    id: TokenProjectId.SwimKaruraAusdLp,
    symbol: "SWIM-KARURA-AUSD-LP",
    displayName: "Karura AUSD LP",
    icon: LP_KARURA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimKaruraUsdtLp]: {
    id: TokenProjectId.SwimKaruraUsdtLp,
    symbol: "SWIM-KARURA-USDT-LP",
    displayName: "Karura USDT LP",
    icon: LP_KARURA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimAcalaAusdLp]: {
    id: TokenProjectId.SwimAcalaAusdLp,
    symbol: "SWIM-ACALA-AUSD-LP",
    displayName: "Acala AUSD LP",
    icon: LP_ACALA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
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
  [TokenProjectId.SwimLpAuroraUsdcUsdte]: {
    id: TokenProjectId.SwimLpAuroraUsdcUsdte,
    symbol: "SWIM-LP-AURORA-USDC-USDT.e",
    displayName: "Aurora USDC/USDT.e Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpAuroraUsn]: {
    id: TokenProjectId.SwimLpAuroraUsn,
    symbol: "SWIM-LP-AURORA-USN",
    displayName: "Aurora USN Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpFantomUsdc]: {
    id: TokenProjectId.SwimLpFantomUsdc,
    symbol: "SWIM-LP-FANTOM-USDC",
    displayName: "Fantom USDC Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpKaruraUsdt]: {
    id: TokenProjectId.SwimLpKaruraUsdt,
    symbol: "SWIM-LP-KARURA-USDT",
    displayName: "Karura USDT Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpKaruraAusd]: {
    id: TokenProjectId.SwimLpKaruraAusd,
    symbol: "SWIM-LP-KARURA-AUSD",
    displayName: "Karura AUSD Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
  [TokenProjectId.SwimLpAcalaAusd]: {
    id: TokenProjectId.SwimLpAcalaAusd,
    symbol: "SWIM-LP-ACALA-AUSD",
    displayName: "Acala AUSD Pool LP",
    icon: SWIM_USD_SVG, // TODO: update
    isStablecoin: false,
    isLp: true,
    tokenNumber: null,
  },
};

export const TOKEN_PROJECTS = Object.values(TOKEN_PROJECTS_BY_ID);
