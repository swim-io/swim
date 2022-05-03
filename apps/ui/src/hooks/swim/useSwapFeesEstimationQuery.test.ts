import { renderHook } from "@testing-library/react-hooks";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { AppContext } from "../../contexts";
import { findLocalnetTokenById, mockOf } from "../../testUtils";

import { useGasPriceQuery } from "./useGasPriceQuery";
import { useSwapFeesEstimationQuery } from "./useSwapFeesEstimationQuery";

jest.mock("./useGasPriceQuery", () => ({
  useGasPriceQuery: jest.fn(),
}));

// Make typescript happy with jest
const useGasPriceQueryMock = mockOf(useGasPriceQuery);

const SOLANA_USDC = findLocalnetTokenById("localnet-solana-usdc");
const SOLANA_USDT = findLocalnetTokenById("localnet-solana-usdt");
const ETHEREUM_USDT = findLocalnetTokenById("localnet-ethereum-usdt");
const BSC_BUSD = findLocalnetTokenById("localnet-bsc-busd");

describe("useSwapFeesEstimationQuery", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    // eslint-disable-next-line testing-library/no-render-in-setup
    renderHook(() => useQueryClient().clear(), {
      wrapper: AppContext,
    });
  });

  it("should return null when the gas price is still loading", async () => {
    useGasPriceQueryMock.mockReturnValue({ isLoading: true, data: undefined });
    const { result } = renderHook(
      () => useSwapFeesEstimationQuery(SOLANA_USDT, ETHEREUM_USDT),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(null);
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
      const { result } = renderHook(
        () => useSwapFeesEstimationQuery(SOLANA_USDC, SOLANA_USDT),
        {
          wrapper: AppContext,
        },
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bsc).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => Ethereum", async () => {
      const { result } = renderHook(
        () => useSwapFeesEstimationQuery(SOLANA_USDC, ETHEREUM_USDT),
        {
          wrapper: AppContext,
        },
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.021));
      expect(result.current?.bsc).toEqual(new Decimal(0));
    });

    it("should return fee for Solana => BSC", async () => {
      const { result } = renderHook(
        () => useSwapFeesEstimationQuery(SOLANA_USDC, BSC_BUSD),
        {
          wrapper: AppContext,
        },
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0));
      expect(result.current?.bsc).toEqual(new Decimal(0.0015));
    });

    it("should return fee for Ethereum => BSC", async () => {
      const { result } = renderHook(
        () => useSwapFeesEstimationQuery(ETHEREUM_USDT, BSC_BUSD),
        {
          wrapper: AppContext,
        },
      );
      expect(result.current?.solana).toEqual(new Decimal(0.01));
      expect(result.current?.ethereum).toEqual(new Decimal(0.0133));
      expect(result.current?.bsc).toEqual(new Decimal(0.0015));
    });
  });
});
