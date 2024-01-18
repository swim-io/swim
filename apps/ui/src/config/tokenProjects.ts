import type {
  TokenProjectId as TokenProjectIdV2,
  TokenProject as TokenProjectV2,
} from "@swim-io/token-projects";
import { TOKEN_PROJECTS_BY_ID as TOKEN_PROJECTS_BY_ID_V2 } from "@swim-io/token-projects";
import type { Override, ReadonlyRecord } from "@swim-io/utils";
import { assertType } from "@swim-io/utils";

/* eslint-disable import/no-unresolved, import/no-webpack-loader-syntax */
// prefix with `!!` to overwrite webpack loader and use url-loader to output base64 instead
import AUSD_SVG from "!!url-loader!../images/tokens/ausd.svg";
import BUSD_SVG from "!!url-loader!../images/tokens/busd.svg";
import GMT_SVG from "!!url-loader!../images/tokens/gmt.svg";
import GST_SVG from "!!url-loader!../images/tokens/gst.svg";
import LP_ACALA_AUSD_SVG from "!!url-loader!../images/tokens/lp_acala_ausd.svg";
import LP_AURORA_USDC_SVG from "!!url-loader!../images/tokens/lp_aurora_usdc.svg";
import LP_AURORA_USDT_SVG from "!!url-loader!../images/tokens/lp_aurora_usdt.svg";
import LP_AVALANCHE_USDC_SVG from "!!url-loader!../images/tokens/lp_avalanche_usdc.svg";
import LP_AVALANCHE_USDT_SVG from "!!url-loader!../images/tokens/lp_avalanche_usdt.svg";
import LP_FANTOM_USDC_SVG from "!!url-loader!../images/tokens/lp_fantom_usdc.svg";
import LP_GMT_SVG from "!!url-loader!../images/tokens/lp_gmt.svg";
import LP_GST_SVG from "!!url-loader!../images/tokens/lp_gst.svg";
import LP_KARURA_AUSD_SVG from "!!url-loader!../images/tokens/lp_karura_ausd.svg";
import LP_KARURA_USDT_SVG from "!!url-loader!../images/tokens/lp_karura_usdt.svg";
import LP_POLYGON_USDC_SVG from "!!url-loader!../images/tokens/lp_polygon_usdc.svg";
import LP_POLYGON_USDT_SVG from "!!url-loader!../images/tokens/lp_polygon_usdt.svg";
import SWIM_TOKEN_SVG from "!!url-loader!../images/tokens/swim.svg";
import SWIM_USD_SVG from "!!url-loader!../images/tokens/swim_usd.svg";
import USDC_SVG from "!!url-loader!../images/tokens/usdc.svg";
import USDT_SVG from "!!url-loader!../images/tokens/usdt.svg";
import XSWIM_TOKEN_SVG from "!!url-loader!../images/tokens/xswim.svg";
/* eslint-enable import/no-unresolved, import/no-webpack-loader-syntax */

export enum TokenProjectIdV1 {
  Ausd = "ausd-v1",
  Busd = "busd-v1",
  Gmt = "gmt-v1",
  Gst = "gst-v1",
  Swim = "swim-v1",
  SwimAcalaAusdLp = "swim-acala-ausd-lp-v1",
  SwimAuroraUsdcLp = "swim-aurora-usdc-lp-v1",
  SwimAuroraUsdtLp = "swim-aurora-usdt-lp-v1",
  SwimAvalancheUsdcLp = "swim-avalanche-usdc-lp-v1",
  SwimAvalancheUsdtLp = "swim-avalanche-usdt-lp-v1",
  SwimFantomUsdcLp = "swim-fantom-usdc-lp-v1",
  SwimKaruraAusdLp = "swim-karura-ausd-lp-v1",
  SwimKaruraUsdtLp = "swim-karura-usdt-lp-v1",
  SwimPolygonUsdcLp = "swim-polygon-usdc-lp-v1",
  SwimPolygonUsdtLp = "swim-polygon-usdt-lp-v1",
  SwimSolanaGmtBinanceGmtLp = "swim-solana-gmt-binance-gst-lp-v1",
  SwimSolanaGstBinanceGstLp = "swim-solana-gst-binance-gst-lp-v1",
  SwimUsdV1 = "swim-usd-v1",
  Usdc = "usdc-v1",
  Usdt = "usdt-v1",
  XSwim = "xswim-v1",
}
// Make sure no name collision with v2
assertType<ReadonlyRecord<string, `${string}-v1`>>()(TokenProjectIdV1);

export type TokenProjectV1 = Override<
  TokenProjectV2,
  {
    readonly id: TokenProjectIdV1;
    readonly tokenNumber?: never;
  }
>;

export const TOKEN_PROJECTS_BY_ID_V1: ReadonlyRecord<
  TokenProjectIdV1,
  TokenProjectV1
> = {
  [TokenProjectIdV1.Usdc]: {
    id: TokenProjectIdV1.Usdc,
    symbol: "USDC",
    displayName: "USD Coin",
    icon: USDC_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectIdV1.Usdt]: {
    id: TokenProjectIdV1.Usdt,
    symbol: "USDT",
    displayName: "Tether USD",
    icon: USDT_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectIdV1.Busd]: {
    id: TokenProjectIdV1.Busd,
    symbol: "BUSD",
    displayName: "Binance USD",
    icon: BUSD_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectIdV1.Ausd]: {
    id: TokenProjectIdV1.Ausd,
    symbol: "aUSD",
    displayName: "Acala USD",
    icon: AUSD_SVG,
    isStablecoin: true,
    isLp: false,
  },
  [TokenProjectIdV1.Gst]: {
    id: TokenProjectIdV1.Gst,
    symbol: "GST",
    displayName: "Green Satoshi Token",
    icon: GST_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectIdV1.Gmt]: {
    id: TokenProjectIdV1.Gmt,
    symbol: "GMT",
    displayName: "STEPN",
    icon: GMT_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectIdV1.SwimUsdV1]: {
    id: TokenProjectIdV1.SwimUsdV1,
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    isLp: true,
  },
  [TokenProjectIdV1.Swim]: {
    id: TokenProjectIdV1.Swim,
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: false,
  },
  [TokenProjectIdV1.XSwim]: {
    id: TokenProjectIdV1.XSwim,
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: XSWIM_TOKEN_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimAvalancheUsdcLp]: {
    id: TokenProjectIdV1.SwimAvalancheUsdcLp,
    symbol: "SWIM-AVALANCHE-USDC-LP",
    displayName: "Avalanche USDC LP",
    icon: LP_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimAvalancheUsdtLp]: {
    id: TokenProjectIdV1.SwimAvalancheUsdtLp,
    symbol: "SWIM-AVALANCHE-USDT-LP",
    displayName: "Avalanche USDT LP",
    icon: LP_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimPolygonUsdcLp]: {
    id: TokenProjectIdV1.SwimPolygonUsdcLp,
    symbol: "SWIM-POLYGON-USDC-LP",
    displayName: "Polygon USDC LP",
    icon: LP_POLYGON_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimPolygonUsdtLp]: {
    id: TokenProjectIdV1.SwimPolygonUsdtLp,
    symbol: "SWIM-POLYGON-USDT-LP",
    displayName: "Polygon USDT LP",
    icon: LP_POLYGON_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimSolanaGstBinanceGstLp]: {
    id: TokenProjectIdV1.SwimSolanaGstBinanceGstLp,
    symbol: "solaGST-binaGST",
    displayName: "Swim Solana GST Binance GST LP",
    icon: LP_GST_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimSolanaGmtBinanceGmtLp]: {
    id: TokenProjectIdV1.SwimSolanaGmtBinanceGmtLp,
    symbol: "solaGMT-binaGMT",
    displayName: "Swim Solana GMT Binance GMT LP",
    icon: LP_GMT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimAuroraUsdcLp]: {
    id: TokenProjectIdV1.SwimAuroraUsdcLp,
    symbol: "SWIM-AURORA-USDC-LP",
    displayName: "Aurora USDC LP",
    icon: LP_AURORA_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimAuroraUsdtLp]: {
    id: TokenProjectIdV1.SwimAuroraUsdtLp,
    symbol: "SWIM-AURORA-USDT-LP",
    displayName: "Aurora USDT LP",
    icon: LP_AURORA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimFantomUsdcLp]: {
    id: TokenProjectIdV1.SwimFantomUsdcLp,
    symbol: "SWIM-FANTOM-USDC-LP",
    displayName: "Fantom USDC LP",
    icon: LP_FANTOM_USDC_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimKaruraAusdLp]: {
    id: TokenProjectIdV1.SwimKaruraAusdLp,
    symbol: "SWIM-KARURA-AUSD-LP",
    displayName: "Karura AUSD LP",
    icon: LP_KARURA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimKaruraUsdtLp]: {
    id: TokenProjectIdV1.SwimKaruraUsdtLp,
    symbol: "SWIM-KARURA-USDT-LP",
    displayName: "Karura USDT LP",
    icon: LP_KARURA_USDT_SVG,
    isStablecoin: false,
    isLp: true,
  },
  [TokenProjectIdV1.SwimAcalaAusdLp]: {
    id: TokenProjectIdV1.SwimAcalaAusdLp,
    symbol: "SWIM-ACALA-AUSD-LP",
    displayName: "Acala AUSD LP",
    icon: LP_ACALA_AUSD_SVG,
    isStablecoin: false,
    isLp: true,
  },
};

export const TOKEN_PROJECTS_V1 = Object.values(TOKEN_PROJECTS_BY_ID_V1);

export function getTokenProject(projectId: TokenProjectIdV1): TokenProjectV1;
export function getTokenProject(projectId: TokenProjectIdV2): TokenProjectV2;
export function getTokenProject(
  projectId: TokenProjectIdV1 | TokenProjectIdV2,
): TokenProjectV1 | TokenProjectV2;
export function getTokenProject(
  projectId: TokenProjectIdV1 | TokenProjectIdV2,
): TokenProjectV1 | TokenProjectV2 {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    TOKEN_PROJECTS_BY_ID_V1[projectId as TokenProjectIdV1] ??
    TOKEN_PROJECTS_BY_ID_V2[projectId as TokenProjectIdV2]
  );
}
