import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import type { EcosystemId } from "../../config";
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
import { useGasPriceQuery } from "./useGasPriceQuery";

jest.mock("./useGasPriceQuery", () => ({
  useGasPriceQuery: jest.fn(),
}));

// Make typescript happy with jest
const useGasPriceQueryMock = mockOf(useGasPriceQuery);

describe("useAddFeesEstimationQuery", () => {
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
        useAddFeesEstimationQuery(
          [
            Amount.fromHuman(SOLANA_USDC, new Decimal(99)),
            Amount.fromHuman(SOLANA_USDT, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDC, new Decimal(99)),
            Amount.fromHuman(ETHEREUM_USDT, new Decimal(99)),
            Amount.fromHuman(BNB_BUSD, new Decimal(0)),
            Amount.fromHuman(BNB_USDT, new Decimal(0)),
          ],
          SOLANA_ECOSYSTEM_ID,
        ),
      );
      expect(result.current).toEqual(null);
    });

    it("should return valid estimation for Solana only add, even when evm gas price are loading", async () => {
      useGasPriceQueryMock.mockReturnValue({
        isLoading: true,
        data: undefined,
      });
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
          SOLANA_ECOSYSTEM_ID,
        ),
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

    it("should return valid estimation for Solana only add", async () => {
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
          SOLANA_ECOSYSTEM_ID,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return eth estimation for Ethereum lpTarget", async () => {
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
          ETHEREUM_ECOSYSTEM_ID,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
      expect(result.current?.bnb).toEqual(new Decimal(0));
    });

    it("should return BNB estimation for BNB lpTarget", async () => {
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
          BNB_ECOSYSTEM_ID,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bnb).toEqual(new Decimal(0.0015));
    });

    it("should return valid estimation for mixed input amounts", async () => {
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
          BNB_ECOSYSTEM_ID,
        ),
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0266));
      expect(result.current?.bnb).toEqual(new Decimal(0.0034));
    });
  });
});
