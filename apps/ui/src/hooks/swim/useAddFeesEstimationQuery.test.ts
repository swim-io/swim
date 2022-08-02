import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "../../fixtures";
import { Amount } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useAddFeesEstimationQuery } from "./useAddFeesEstimationQuery";
import { useGasPriceQueries } from "./useGasPriceQuery";

jest.mock("./useGasPriceQuery", () => {
  const mockedUseGasPriceQueries = jest.fn();
  return {
    ...jest.requireActual("./useGasPriceQuery"),
    useGasPriceQuery: (evmEcosystemId: EvmEcosystemId) =>
      mockedUseGasPriceQueries([evmEcosystemId])[0],
    useGasPriceQueries: mockedUseGasPriceQueries,
  };
});

// Make typescript happy with jest
const useGasPriceQueriesMock = mockOf(useGasPriceQueries);

describe("useAddFeesEstimationQuery", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  describe("loading", () => {
    it("should return null when the required gas price is still loading", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => ({
            isLoading: true,
            data: undefined,
          }));
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(99)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          EcosystemId.Solana,
        ),
      );
      expect(result.current).toEqual(null);
    });

    it("should return valid estimation for Solana only add, even when evm gas price are loading", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => ({
            isLoading: true,
            data: undefined,
          }));
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(0)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          EcosystemId.Solana,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });
  });

  describe("loaded", () => {
    beforeEach(() => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => {
            return ecosystemId === EcosystemId.Ethereum
              ? { data: new Decimal(7e-8) }
              : { data: new Decimal(5e-9) };
          });
        },
      );
    });

    it("should return valid estimation for Solana only add", () => {
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(0)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          EcosystemId.Solana,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return eth estimation for Ethereum lpTarget", () => {
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(0)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          EcosystemId.Ethereum,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return BNB estimation for BNB lpTarget", () => {
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(0)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(0)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          EcosystemId.Bnb,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });

    it("should return valid estimation for mixed input amounts", () => {
      const { result } = renderHookWithAppContext(() =>
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(100)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(100)),
            Amount.fromHuman(BNB_BUSD, new Decimal(101)),
            Amount.fromHuman(BNB_USDT, new Decimal(101)),
          ],
          EcosystemId.Bnb,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0266));
      expect(result.current?.bnb).toEqual(new Decimal(0.0034));
    });
  });
});
