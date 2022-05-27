import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import {
  BSC_BUSD,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "../../fixtures";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useGasPriceQuery } from "./useGasPriceQuery";
import { useSwapFeesEstimationQuery } from "./useSwapFeesEstimationQuery";

jest.mock("./useGasPriceQuery", () => ({
  useGasPriceQuery: jest.fn(),
}));

// Make typescript happy with jest
const useGasPriceQueryMock = mockOf(useGasPriceQuery);

describe("useSwapFeesEstimationQuery", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  describe("loading", () => {
    it("should return null when the required gas price is still loading", async () => {
      useGasPriceQueryMock.mockReturnValue({
        isLoading: true,
        data: undefined,
      });
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDT, ETHEREUM_USDT),
      );
      expect(result.current).toEqual(null);
    });

    it("should return fixed fee for Solana only swap, even when evm gas price is loading", async () => {
      useGasPriceQueryMock.mockReturnValue({
        isLoading: true,
        data: undefined,
      });
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, SOLANA_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bsc).toEqual(new Decimal(0));
    });
  });

  describe("loaded", () => {
    beforeEach(() => {
      useGasPriceQueryMock.mockImplementation((ecosystemId: EcosystemId) =>
        ecosystemId === EcosystemId.Ethereum
          ? { data: new Decimal(7e-8) }
          : { data: new Decimal(5e-9) },
      );
    });

    it("should return fixed fee for Solana only swap", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, SOLANA_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bsc).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => Ethereum", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, ETHEREUM_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
      expect(result.current?.bsc).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => BSC", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, BSC_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bsc).toEqual(new Decimal(0.0015));
    });

    it("should return fee for Ethereum => BSC", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(ETHEREUM_USDT, BSC_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0133));
      expect(result.current?.bsc).toEqual(new Decimal(0.0015));
    });
  });
});
