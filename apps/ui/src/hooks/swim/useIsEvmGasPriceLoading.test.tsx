import Decimal from "decimal.js";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useGasPriceQueries } from "./useGasPriceQuery";
import { useIsEvmGasPriceLoading } from "./useIsEvmGasPriceLoading";

jest.mock("./useGasPriceQuery", () => ({
  useGasPriceQueries: jest.fn(),
}));

// Make typescript happy with jest
const useGasPriceQueriesMock = mockOf(useGasPriceQueries);

describe("useIsEvmGasPriceLoading", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  describe("loading", () => {
    it("should return false for empty array", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => ({
            isLoading: true,
            data: undefined,
          }));
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([]),
      );
      expect(result.current).toEqual(false);
    });

    it("should return true if required evm gas price is loading", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => {
            return ecosystemId === EcosystemId.Ethereum
              ? { isLoading: true, data: undefined }
              : { isLoading: false, data: new Decimal(5e-9) };
          });
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([EcosystemId.Ethereum]),
      );
      expect(result.current).toEqual(true);
    });
  });

  describe("loaded", () => {
    it("should return false if required evm gas price is loaded", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => {
            return ecosystemId === EcosystemId.Ethereum
              ? { isLoading: false, data: new Decimal(5e-9) }
              : { isLoading: true, data: undefined };
          });
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([EcosystemId.Ethereum]),
      );
      expect(result.current).toEqual(false);
    });

    it("should return false if all evm gas price are loaded", () => {
      useGasPriceQueriesMock.mockImplementation(
        (ecosystemIds: readonly EcosystemId[]): any => {
          return ecosystemIds.map((ecosystemId) => ({
            isLoading: false,
            data: new Decimal(5e-9),
          }));
        },
      );
      const { result } = renderHookWithAppContext(() =>
        useIsEvmGasPriceLoading([
          EcosystemId.Ethereum,
          EcosystemId.Bnb,
          EcosystemId.Polygon,
          EcosystemId.Avalanche,
        ]),
      );
      expect(result.current).toEqual(false);
    });
  });
});
