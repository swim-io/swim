import AUSD_SVG from "../images/tokens/ausd.svg";
import BUSD_SVG from "../images/tokens/busd.svg";
import GMT_SVG from "../images/tokens/gmt.svg";
import GST_SVG from "../images/tokens/gst.svg";
import LP_GMT_SVG from "../images/tokens/lp_gmt.svg";
import LP_GST_SVG from "../images/tokens/lp_gst.svg";
import LP_META_ACALA_AUSD_SVG from "../images/tokens/lp_metapool_acala_ausd.svg";
import LP_META_AURORA_USDC_SVG from "../images/tokens/lp_metapool_aurora_usdc.svg";
import LP_META_AURORA_USDT_SVG from "../images/tokens/lp_metapool_aurora_usdt.svg";
import LP_META_AURORA_USN_SVG from "../images/tokens/lp_metapool_aurora_usn.svg";
import LP_META_AVALANCHE_USDC_SVG from "../images/tokens/lp_metapool_avalanche_usdc.svg";
import LP_META_AVALANCHE_USDT_SVG from "../images/tokens/lp_metapool_avalanche_usdt.svg";
import LP_META_FANTOM_USDC_SVG from "../images/tokens/lp_metapool_fantom_usdc.svg";
import LP_META_KARURA_AUSD_SVG from "../images/tokens/lp_metapool_karura_ausd.svg";
import LP_META_KARURA_USDT_SVG from "../images/tokens/lp_metapool_karura_usdt.svg";
import LP_META_POLYGON_USDC_SVG from "../images/tokens/lp_metapool_polygon_usdc.svg";
import LP_META_POLYGON_USDT_SVG from "../images/tokens/lp_metapool_polygon_usdt.svg";
import SWIM_TOKEN_SVG from "../images/tokens/swim_token.svg";
import SWIM_USD_SVG from "../images/tokens/swim_usd.svg";
import USDC_SVG from "../images/tokens/usdc.svg";
import USDT_SVG from "../images/tokens/usdt.svg";
import USN_SVG from "../images/tokens/usn.svg";
import type { ReadonlyRecord } from "../utils";

export enum TokenProjectId {
  Ausd = "ausd",
  Busd = "busd",
  Gmt = "gmt",
  Gst = "gst",
  Swim = "swim",
  SwimAcalaAusdMetaPoolLp = "swim-acala-ausd-meta-pool-lp",
  SwimAuroraUsdcMetaPoolLp = "swim-aurora-usdc-meta-pool-lp",
  SwimAuroraUsdtMetaPoolLp = "swim-aurora-usdt-meta-pool-lp",
  SwimAuroraUsnMetaPoolLp = "swim-aurora-usn-meta-pool-lp",
  SwimAvalancheUsdcMetaPoolLp = "swim-avalanche-usdc-meta-pool-lp",
  SwimAvalancheUsdtMetaPoolLp = "swim-avalanche-usdt-meta-pool-lp",
  SwimFantomUsdcMetaPoolLp = "swim-fantom-usdc-meta-pool-lp",
  SwimKaruraAusdMetaPoolLp = "swim-karura-ausd-meta-pool-lp",
  SwimKaruraUsdtMetaPoolLp = "swim-karura-usdt-meta-pool-lp",
  SwimPolygonUsdcMetaPoolLp = "swim-polygon-usdc-meta-pool-lp",
  SwimPolygonUsdtMetaPoolLp = "swim-polygon-usdt-meta-pool-lp",
  SwimSolanaGmtBinanceGmtLp = "swim-solana-gmt-binance-gst-lp",
  SwimSolanaGstBinanceGstLp = "swim-solana-gst-binance-gst-lp",
  SwimUsd = "swim-usd",
  Usdc = "usdc",
  Usdt = "usdt",
  Usn = "usn",
  Xswim = "x-swim",
}

export interface TokenProject {
  readonly id: TokenProjectId;
  readonly symbol: string;
  readonly displayName: string;
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly isLP: boolean;
}

export const PROJECT_LIST: readonly TokenProject[] = [
  {
    id: TokenProjectId.Usdc,
    symbol: "USDC",
    displayName: "USD Coin",
    icon: USDC_SVG,
    isStablecoin: true,
    isLP: false,
  },
  {
    id: TokenProjectId.Usdt,
    symbol: "USDT",
    displayName: "Tether USD",
    icon: USDT_SVG,
    isStablecoin: true,
    isLP: false,
  },
  {
    id: TokenProjectId.Usn,
    symbol: "USN",
    displayName: "USN",
    icon: USN_SVG,
    isStablecoin: true,
    isLP: false,
  },
  {
    id: TokenProjectId.Busd,
    symbol: "BUSD",
    displayName: "Binance USD",
    icon: BUSD_SVG,
    isStablecoin: true,
    isLP: false,
  },
  {
    id: TokenProjectId.Ausd,
    symbol: "aUSD",
    displayName: "Acala USD",
    icon: AUSD_SVG,
    isStablecoin: true,
    isLP: false,
  },
  {
    id: TokenProjectId.Gst,
    symbol: "GST",
    displayName: "Green Satoshi Token",
    icon: GST_SVG,
    isStablecoin: false,
    isLP: false,
  },
  {
    id: TokenProjectId.Gmt,
    symbol: "GMT",
    displayName: "STEPN",
    icon: GMT_SVG,
    isStablecoin: false,
    isLP: false,
  },
  {
    id: TokenProjectId.SwimUsd,
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    isLP: true,
  },
  {
    id: TokenProjectId.Swim,
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    isLP: false,
  },
  {
    id: TokenProjectId.Xswim,
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: SWIM_USD_SVG, // TODO: Change?
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAvalancheUsdcMetaPoolLp,
    symbol: "SWIM-AVALANCHE-USDC-META-POOL-LP",
    displayName: "Avalanche USDC Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAvalancheUsdtMetaPoolLp,
    symbol: "SWIM-AVALANCHE-USDT-META-POOL-LP",
    displayName: "Avalanche USDT Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimPolygonUsdcMetaPoolLp,
    symbol: "SWIM-POLYGON-USDC-META-POOL-LP",
    displayName: "Polygon USDC Meta-Pool LP",
    icon: LP_META_POLYGON_USDC_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimPolygonUsdtMetaPoolLp,
    symbol: "SWIM-POLYGON-USDT-META-POOL-LP",
    displayName: "Polygon USDT Meta-Pool LP",
    icon: LP_META_POLYGON_USDT_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimSolanaGstBinanceGstLp,
    symbol: "solaGST-binaGST",
    displayName: "Swim Solana GST Binance GST LP",
    icon: LP_GST_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    symbol: "solaGMT-binaGMT",
    displayName: "Swim Solana GMT Binance GMT LP",
    icon: LP_GMT_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAuroraUsdcMetaPoolLp,
    symbol: "SWIM-AURORA-USDC-META-POOL-LP",
    displayName: "Aurora USDC Meta-Pool LP",
    icon: LP_META_AURORA_USDC_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAuroraUsdtMetaPoolLp,
    symbol: "SWIM-AURORA-USDT-META-POOL-LP",
    displayName: "Aurora USDT Meta-Pool LP",
    icon: LP_META_AURORA_USDT_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAuroraUsnMetaPoolLp,
    symbol: "SWIM-AURORA-USN-META-POOL-LP",
    displayName: "Aurora USN Meta-Pool LP",
    icon: LP_META_AURORA_USN_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimFantomUsdcMetaPoolLp,
    symbol: "SWIM-FANTOM-USDC-META-POOL-LP",
    displayName: "Fantom USDC Meta-Pool LP",
    icon: LP_META_FANTOM_USDC_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimKaruraAusdMetaPoolLp,
    symbol: "SWIM-KARURA-AUSD-META-POOL-LP",
    displayName: "Karura AUSD Meta-Pool LP",
    icon: LP_META_KARURA_AUSD_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimKaruraUsdtMetaPoolLp,
    symbol: "SWIM-KARURA-USDT-META-POOL-LP",
    displayName: "Karura USDT Meta-Pool LP",
    icon: LP_META_KARURA_USDT_SVG,
    isStablecoin: false,
    isLP: true,
  },
  {
    id: TokenProjectId.SwimAcalaAusdMetaPoolLp,
    symbol: "SWIM-ACALA-AUSD-META-POOL-LP",
    displayName: "Acala AUSD Meta-Pool LP",
    icon: LP_META_ACALA_AUSD_SVG,
    isStablecoin: false,
    isLP: true,
  },
];

export const PROJECTS: ReadonlyRecord<TokenProjectId, TokenProject> =
  Object.fromEntries(
    PROJECT_LIST.map((project) => [project.id, project]),
  ) as ReadonlyRecord<TokenProjectId, TokenProject>;
