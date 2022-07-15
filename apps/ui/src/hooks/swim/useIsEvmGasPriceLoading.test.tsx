import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import type { EcosystemId } from "../../config";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useGasPriceQuery } from "./useGasPriceQuery";
import { useIsEvmGasPriceLoading } from "./useIsEvmGasPriceLoading";

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
    it("should return false for empty array", async () => {
      useGasPriceQueryMock.mockReturnValue({
        isLoading: true,
        data: undefined,
      });
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([]),
      );
      expect(result.current).toEqual(false);
    });

    it("should return true if required evm gas price is loading", async () => {
      useGasPriceQueryMock.mockImplementation((ecosystemId: EcosystemId) =>
        ecosystemId === ETHEREUM_ECOSYSTEM_ID
          ? { isLoading: true, data: undefined }
          : { isLoading: false, data: new Decimal(5e-9) },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([ETHEREUM_ECOSYSTEM_ID]),
      );
      expect(result.current).toEqual(true);
    });
  });

  describe("loaded", () => {
    it("should return false if required evm gas price is loaded", async () => {
      useGasPriceQueryMock.mockImplementation((ecosystemId: EcosystemId) =>
        ecosystemId === ETHEREUM_ECOSYSTEM_ID
          ? { isLoading: false, data: new Decimal(5e-9) }
          : { isLoading: true, data: undefined },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([ETHEREUM_ECOSYSTEM_ID]),
      );
      expect(result.current).toEqual(false);
    });

    it("should return false if all evm gas price are loaded", async () => {
      useGasPriceQueryMock.mockReturnValue({
        isLoading: false,
        data: new Decimal(5e-9),
      });
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([
          ETHEREUM_ECOSYSTEM_ID,
          BNB_ECOSYSTEM_ID,
          // EcosystemId.Polygon,
          // EcosystemId.Avalanche,
        ]),
      );
      expect(result.current).toEqual(false);
    });
  });
});
