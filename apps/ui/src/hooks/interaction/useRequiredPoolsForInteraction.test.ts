import { useQueryClient } from "react-query";

import { Env, configs } from "../../config";
import { useConfig } from "../../contexts";
import {
  BSC_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_SOL_USDT_SWAP,
} from "../../fixtures/swim/interactions";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useRequiredPoolsForInteraction } from "./useRequiredPoolsForInteraction";

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useConfig: jest.fn(),
}));

// Make typescript happy with jest
const useConfigMock = mockOf(useConfig);

describe("useRequiredPoolsForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    useConfigMock.mockReturnValue(configs[Env.Localnet]);
  });

  it("should return hexapool for ETH USDC to SOL USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(ETH_USDC_TO_SOL_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for SOL USDC to ETH USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(SOL_USDC_TO_ETH_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for SOL USDC to SOL USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(SOL_USDC_TO_SOL_USDT_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for BSC USDT to ETH USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(BSC_USDT_TO_ETH_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });
});
