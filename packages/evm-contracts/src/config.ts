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

//"fixed" constants (either can't be changed by us or implementation critically relies on them):
export const WORMHOLE_SOLANA_CHAIN_ID = 1;
export const POOL_PRECISION = 6;
export const ROUTING_PRECISION = 18;
export const SWIM_USD_DECIMALS = 6;
export const SWIM_USD_TOKEN_INDEX = 0;
export const SWIM_USD_TOKEN_NUMBER = 0;

//"variable" constants:
export const SWIM_FACTORY_ADDRESS = "0xDef312467D48bdDED813de11C3ee4c257e6eD7aD";
export const ROUTING_CONTRACT_SOLANA_ADDRESS =
  "0x857d8c691b9e9a1a1e98d010a36d6401a9099ce89d821751410623ad7c2a20d2";
export const SWIM_USD_SOLANA_ADDRESS =
  "0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719";
export const PROPELLER_GAS_TIP = "10000000000"; //i.e. 1e9, i.e. 1 gwei

export const GAS_TOKEN_DECIMALS = 18; //1e18 wei in 1 ETH or BNB, or AVAX, ...

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

const AVALANCHE_TESTNET = {
  name: "Avalanche Fuji Testnet",
  routing: {
    wormholeTokenBridge: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { symbol: "USDC" as const, address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC" },
        { symbol: "USDT" as const, address: "0x489dDcd070b6c4e0373FBB5d529Cc06328E048c3" },
      ],
    },
  ],
};

const POLYGON_TESTNET = {
  name: "Polygon Mumbai Testnet",
  routing: {
    wormholeTokenBridge: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { symbol: "USDC" as const, address: "0x0a0d7cEA57faCBf5DBD0D3b5169Ab00AC8Cf7dd1" },
        { symbol: "USDT" as const, address: "0x2Ac9183EC64F71AfB73909c7C028Db14d35FAD2F" },
      ],
    },
  ],
};

const FANTOM_TESTNET = {
  name: "Fantom Testnet",
  routing: {
    wormholeTokenBridge: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
  },
  pools: [
    {
      salt: "0x" + "00".repeat(31) + "01",
      lpSalt: "0x" + "00".repeat(31) + "11",
      lpName: "Test Pool LP",
      lpSymbol: "LP",
      tokens: [
        { symbol: "USDC" as const, address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC" },
      ],
    },
  ],
};

export const CHAINS: { readonly [chainId: number]: ChainConfig | undefined } = {
  5: GOERLI,
  97: BNB_TESTNET,
  31337: LOCAL,
  43113: AVALANCHE_TESTNET,
  80001: POLYGON_TESTNET,
  4002: FANTOM_TESTNET,
};
