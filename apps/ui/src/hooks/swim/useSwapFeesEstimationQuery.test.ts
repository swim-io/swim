import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import type { EcosystemId } from "../../config";
import {
  BNB_BUSD,
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
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });
  });

  describe("loaded", () => {
    beforeEach(() => {
      useGasPriceQueryMock.mockImplementation((ecosystemId: EcosystemId) =>
        ecosystemId === ETHEREUM_ECOSYSTEM_ID
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
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => Ethereum", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, ETHEREUM_USDT),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => BNB", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(SOLANA_USDC, BNB_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });

    it("should return fee for Ethereum => BNB", async () => {
      const { result } = renderHookWithAppContext(() =>
        useSwapFeesEstimationQuery(ETHEREUM_USDT, BNB_BUSD),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0133));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });
  });
});
