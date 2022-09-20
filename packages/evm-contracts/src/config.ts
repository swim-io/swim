import { HARDHAT_FACTORY_PRESIGNED } from "./presigned";

export type TokenSymbol = "swimUSD" | "USDC" | "USDT" | "BUSD";

export type TestToken = {
  //will be dynamically deployed
  readonly symbol: TokenSymbol;
  readonly name: string;
  readonly decimals: number;
};

export type DeployedToken = {
  //must already exist on-chain
  readonly symbol: TokenSymbol;
  readonly address: string;
};

export type TokenConfig = TestToken | DeployedToken;

export type PoolConfig = {
  readonly salt: string;
  readonly lpSalt: string;
  readonly lpName?: string;
  readonly lpSymbol?: string;
  readonly lpDecimals?: number;
  readonly ampFactor?: number;
  readonly lpFee?: number;
  readonly govFee?: number;
  readonly tokens: readonly TokenConfig[];
};

export type RoutingFixedGasPrice = {
  readonly fixedSwimUsdPerGasToken: number;
};

export type RoutingUniswapOracle = {
  readonly intermediateToken: TokenSymbol;
  readonly uniswapPoolAddress: string;
};

export type RoutingConfig = {
  readonly wormholeTokenBridge: string | "MOCK";
  readonly serviceFee?: number;
  readonly gasPriceMethod?: RoutingFixedGasPrice | RoutingUniswapOracle;
};

export type ChainConfig = {
  readonly name: string;
  readonly factoryPresigned?: string;
  readonly routing: RoutingConfig | "MOCK";
  readonly pools?: readonly PoolConfig[];
};

export const SWIM_FACTORY_ADDRESS = "0x36E284788aaA29C16cc227E09477C8e73D96ffD3";
export const SWIM_USD_SOLANA_ADDRESS =
  "0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719";
export const ROUTING_CONTRACT_SOLANA_ADDRESS = "0x" + "00".repeat(32); //TBD
export const WORMHOLE_SOLANA_CHAIN_ID = 1;
export const POOL_PRECISION = 6;
export const SWIM_USD_DECIMALS = 6;

export const TOKEN_NUMBERS: Record<TokenSymbol, number> = {
  swimUSD: 0,
  USDC: 1,
  USDT: 2,
  BUSD: 3,
};

export const DEFAULTS = {
  salt: "0x" + "00".repeat(32),
  lpDecimals: SWIM_USD_DECIMALS,
  amp: 1_000, //3 decimals
  lpFee: 300, //fee as 100th of a bip (6 decimals, 1000000 = 100 % fee)
  governanceFee: 100,
  swimUsd: {
    symbol: "swimUSD" as const,
    name: "SwimUSD",
    decimals: SWIM_USD_DECIMALS,
  },
  serviceFee: 10 ** (SWIM_USD_DECIMALS - 2),
  gasPriceMethod: {
    //set price of 1 human gas token (18 decimals) = of 1 human swimUSD (6 decimals)
    //so if 10^18 wei = 10^6 swimUSD and we specify price with 18 decimals the 10^18 cancel out:
    fixedSwimUsdPerGasToken: 10 ** SWIM_USD_DECIMALS,
  },
};

export const SALTS = {
  logic: {
    //same name as Solidity contracts
    Pool: DEFAULTS.salt,
    Routing: DEFAULTS.salt,
    LpToken: DEFAULTS.salt,
  },
  proxy: {
    Routing: DEFAULTS.salt,
  },
};

export const LOCAL = {
  name: "Local Network",
  factoryPresigned: HARDHAT_FACTORY_PRESIGNED,
  routing: {
    wormholeTokenBridge: "MOCK" as const, //will deploy MockWormhole and MockTokenBridge
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { symbol: "USDC" as const, name: "USD Coin", decimals: 6 },
        { symbol: "USDT" as const, name: "Tether", decimals: 6 },
      ],
    },
  ],
};

const GOERLI = {
  name: "Ethereum Goerli Testnet",
  routing: {
    wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        //usdc and usdt both already have 6 decimals on Goerli
        { symbol: "USDC" as const, address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6" },
        { symbol: "USDT" as const, address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B" },
      ],
    },
  ],
};

const BNB_TESTNET = {
  name: "BNB Chain Testnet",
  routing: {
    wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "03",
      lpSalt: "0x" + "00".repeat(31) + "13",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { symbol: "BUSD" as const, address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC" },
        { symbol: "USDT" as const, address: "0x98529E942FD121d9C470c3d4431A008257E0E714" },
      ],
    },
  ],
};

export const CHAINS: { readonly [chainId: number]: ChainConfig | undefined } = {
  5: GOERLI,
  97: BNB_TESTNET,
  31337: LOCAL,
};
