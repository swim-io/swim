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
    // From https://book.wormhole.com/reference/contracts.html
    bridge:
      "0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f",
    portal:
      "0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625",
  },
  publicRpcUrls: ["https://testnet.aptoslabs.com/v1"],
  swimUsdDetails: {
    address:
      "0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T",
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
          "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::lp_coin::LP<0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
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
        "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<0x30ab37efc691ea7202540b50f3f0f6b090adb143c0746fd49a7e4b7c5870ce8b::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
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
