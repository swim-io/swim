import { act, renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { Env } from "../../config";
import { useEnvironment } from "../../core/store";
import {
  BSC_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_SOL_USDT_SWAP,
} from "../../fixtures/swim/interactions";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useInteraction } from "./useInteraction";
import { useRequiredPoolsForInteraction } from "./useRequiredPoolsForInteraction";

jest.mock("./useInteraction", () => ({
  ...jest.requireActual("./useInteraction"),
  useInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useInteractionMock = mockOf(useInteraction);

describe("useRequiredPoolsForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    const { result: envStore } = renderHook(() => useEnvironment());
    act(() => {
      envStore.current.setCustomLocalnetIp("127.0.0.1");
      envStore.current.setEnv(Env.Localnet);
    });
  });

  it("should return hexapool for ETH USDC to SOL USDC Swap", () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for SOL USDC to ETH USDC Swap", () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(SOL_USDC_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for SOL USDC to SOL USDC Swap", () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(SOL_USDC_TO_SOL_USDT_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });

  it("should return hexapool for BSC USDT to ETH USDC Swap", () => {
    useInteractionMock.mockReturnValue(BSC_USDT_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredPoolsForInteraction(BSC_USDT_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual(["hexapool"]);
  });
});
