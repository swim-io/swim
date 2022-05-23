import { cleanup } from "@testing-library/react";
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
import { useRequiredTokensForInteraction } from "./useRequiredTokensForInteraction";

jest.mock("./useInteraction", () => ({
  ...jest.requireActual("./useInteraction"),
  useInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useInteractionMock = mockOf(useInteraction);

describe("useRequiredTokensForInteraction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    cleanup();
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());

    const { result: envStore } = renderHook(() => useEnvironment());
    act(() => {
      envStore.current.setCustomLocalnetIp("127.0.0.1");
      envStore.current.setEnv(Env.Localnet);
    });
  });

  it("should return required tokens for ETH USDC to SOL USDC Swap", async () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-ethereum-usdc",
      "localnet-solana-usdc",
    ]);
  });

  it("should return required tokens for SOL USDC to ETH USDC Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-ethereum-usdc",
    ]);
  });

  it("should return required tokens for SOL USDC to SOL USDT Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_SOL_USDT_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-solana-usdt",
    ]);
  });

  it("should return required tokens for BSC USDT to ETH USDC Swap", async () => {
    useInteractionMock.mockReturnValue(BSC_USDT_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(BSC_USDT_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-bsc-usdt",
      "localnet-ethereum-usdc",
    ]);
  });
});
