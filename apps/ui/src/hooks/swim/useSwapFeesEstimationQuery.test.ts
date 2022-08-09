import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import {
  BNB_BUSD,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "../../fixtures";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useGasPriceQueries } from "./useGasPriceQuery";
import { useSwapFeesEstimationQuery } from "./useSwapFeesEstimationQuery";

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

describe("useSwapFeesEstimationQuery", () => {
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
        useSwapFeesEstimationQuery(SOLANA_USDT, ETHEREUM_USDT),
      );
      expect(result.current).toEqual(null);
    });

    it("should return fixed fee for Solana only swap, even when evm gas price is loading", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => ({
            isLoading: true,
            data: undefined,
          }));
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, SOLANA_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
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

    it("should return fixed fee for Solana only swap", () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, SOLANA_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
    });

    it("should return fee for Solana => Ethereum", () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, ETHEREUM_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
    });

    it("should return fee for Solana => BNB", () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, BNB_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });

    it("should return fee for Ethereum => BNB", () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(ETHEREUM_USDT, BNB_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0133));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });
  });
});
