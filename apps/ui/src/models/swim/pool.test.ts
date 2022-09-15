import type solana from "@solana/web3.js";
import { Env } from "@swim-io/core";
import type { EvmConnection, EvmTx } from "@swim-io/evm";
import { EvmEcosystemId } from "@swim-io/evm";
import { Routing__factory } from "@swim-io/evm-contracts";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ethers } from "ethers";
import { BigNumber } from "ethers";
import { mock, mockDeep } from "jest-mock-extended";

import type { Config, EvmPoolSpec } from "../../config";
import {
  CONFIGS,
  DEVNET_POOLS_FOR_RESTRUCTURE,
  DEVNET_SWIMUSD,
  DEVNET_TOKENS,
  DEVNET_TOKENS_FOR_RESTRUCTURE,
} from "../../config";
import { parsedWormholeRedeemEvmUnlockWrappedTx } from "../../fixtures/solana/txs";

import { getEvmPoolState, getTokensByPool, isPoolTx } from "./pool";

describe("Pool tests", () => {
  describe("getTokensByPool", () => {
    it("returns tokens by pool id for local config", () => {
      const localConfig: Config = CONFIGS[Env.Local];
      const result = getTokensByPool(localConfig);

      localConfig.pools.forEach((pool) => {
        const tokenIds = result[pool.id].tokens.map((token) => token.id);
        expect(tokenIds).toEqual(pool.tokens);
        expect(result[pool.id].lpToken.id).toEqual(pool.lpToken);
      });
    });
  });

  describe("isPoolTx", () => {
    it("returns false for EVM tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ecosystemId = EvmEcosystemId.Ethereum;
      const txResponse: ethers.providers.TransactionResponse =
        mock<ethers.providers.TransactionResponse>();
      const txReceipt: ethers.providers.TransactionReceipt =
        mock<ethers.providers.TransactionReceipt>();
      const tx: EvmTx = {
        id: "string",
        timestamp: 123456789,
        ecosystemId: ecosystemId,
        response: txResponse,
        receipt: txReceipt,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, tx)).toBe(false);
    });

    it("returns false, if not pool Solana tx", () => {
      const contractAddress = "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC";
      const ptx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        parsedTx: ptx,
        id: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBe(false);
    });

    it("returns true, if it's pool solana tx", () => {
      const contractAddress = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
      const ptx = {
        ...mockDeep<solana.ParsedTransactionWithMeta>(),
        transaction: parsedWormholeRedeemEvmUnlockWrappedTx.transaction,
      };
      const txs: SolanaTx = {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        parsedTx: ptx,
        id: "string",
        timestamp: 123456789,
        interactionId: "1",
      };
      expect(isPoolTx(contractAddress, txs)).toBe(true);
    });
  });

  describe("getEvmPoolState", () => {
    const MOCK_STATE = {
      paused: false,
      balances: [
        [
          "0x4873edbb0B4b5b48A6FBe50CacB85e58D0b62ab5",
          BigNumber.from("2087941202"),
        ],
        [
          "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
          BigNumber.from("2052006916"),
        ],
        [
          "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
          BigNumber.from("2117774978"),
        ],
      ],
      totalLpSupply: [
        "0xf3eb1180A64827A602A7e02883b7299191527073",
        BigNumber.from("1968249268"),
      ],
      ampFactor: [BigNumber.from("1000"), 3],
      lpFee: [BigNumber.from("300"), 6],
      governanceFee: [BigNumber.from("100"), 6],
    };

    beforeEach(() => {
      Routing__factory.connect = jest.fn().mockReturnValue({
        getPoolStates: () => Promise.resolve([MOCK_STATE]),
      });
    });

    it("should return EVM pool state in human decimal", async () => {
      const ethereumPool = findOrThrow(
        DEVNET_POOLS_FOR_RESTRUCTURE,
        (poolSpec) => poolSpec.id === "devnet-ethereum-usdc-usdt",
      );
      const tokens = [
        ...DEVNET_TOKENS,
        DEVNET_SWIMUSD,
        ...DEVNET_TOKENS_FOR_RESTRUCTURE,
      ];
      const state = await getEvmPoolState(
        {} as EvmConnection,
        ethereumPool as EvmPoolSpec,
        tokens,
        "MOCK_ADDRESS",
      );
      expect(state).toEqual({
        ampFactor: new Decimal("1"),
        balances: [
          new Decimal("2087.941202"),
          new Decimal("2052.006916"),
          new Decimal("2117.774978"),
        ],
        ecosystem: "ethereum",
        governanceFee: new Decimal("0.0001"),
        isPaused: false,
        lpFee: new Decimal("0.0003"),
        totalLpSupply: new Decimal("1968.249268"),
      });
    });
  });
});
