import type { GasToken, TokenDetails } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type { AptosChainConfig, AptosEcosystemConfig } from "./protocol";
import { APTOS_ECOSYSTEM_ID, APTOS_PROTOCOL } from "./protocol";

export enum AptosChainId {
  Mainnet = 1,
  Testnet = 2,
  Devnet = 34,
}

const EMPTY_MAP: ReadonlyMap<string, TokenDetails> = new Map();

const testnet: AptosChainConfig = {
  name: "Aptos Testnet",
  chainId: AptosChainId.Testnet,
  wormhole: {
    // Usually listed in https://book.wormhole.com/reference/contracts.html
    // For now https://github.com/kcsongor provided these addresses:
    // https://github.com/wormhole-foundation/wormhole/blob/a93d8d65296410e5d6d8d214edd7ce6cb454fa76/clients/js/main.ts#L82-L85
    // and told us that the same addresses will be used in production.
    bridge:
      "0x7041d0a5ae46a24fd5f1df67c54bf1a2e0fe7668ae9402e30e58f3ad452f9d52",
    portal:
      "0x799c8d35a610b6fa8ed33432e31c686c97b4ce4205fce88c13577615372e99a3",
  },
  publicRpcUrls: ["https://testnet.aptoslabs.com/v1"],
  swimUsdDetails: {
    address:
      "0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T",
    decimals: 6,
  },
  routingContractAddress: "", // no routing contract for now
  tokens: [
    {
      id: "testnet-aptos-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address:
          "0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-aptos-lp-meta-aptos-usdc",
      projectId: TokenProjectId.SwimAptosUsdcLp,
      nativeDetails: {
        address:
          "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::lp_coin::LP<0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [
    {
      id: "meta-aptos-usdc",
      ecosystemId: APTOS_ECOSYSTEM_ID,
      displayName: "Aptos USDC",
      isStakingPool: false,
      isStableSwap: true, // TODO is it?
      isLegacyPool: false, // TODO, not legacy, not evm though, do we need a type here?
      // address is the type of the resource. All liquidswap pools have the same owner, see https://github.com/pontem-network/liquidswap/blob/5fc2625652c15369d0ffc52f9024c180d6e72fea/Move.toml#L15
      address:
        "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
      // the account that all pools are stored into
      owner:
        "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948",
      feeDecimals: 6, // TODO ? https://github.com/pontem-network/liquidswap/blob/5fc2625652c15369d0ffc52f9024c180d6e72fea/sources/swap/liquidity_pool.move#L70-L74
      lpTokenId: "testnet-aptos-lp-meta-aptos-usdc",
      tokenIds: ["testnet-aptos-usdc", "testnet-swimusd"],
    },
  ],
};

const gasToken: GasToken = {
  name: "Aptos Coin",
  symbol: "APT",
  decimals: 8,
};

export const aptos = assertType<AptosEcosystemConfig>()({
  id: APTOS_ECOSYSTEM_ID,
  protocol: APTOS_PROTOCOL,
  wormholeChainId: 22,
  displayName: "Aptos",
  gasToken,
  chains: {
    [Env.Testnet]: testnet,
  },
} as const);
