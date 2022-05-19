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

import { useInteraction } from "./useInteraction";
import { useRequiredTokensForInteraction } from "./useRequiredTokensForInteraction";

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useConfig: jest.fn(),
}));
jest.mock("./useInteraction", () => ({
  ...jest.requireActual("./useInteraction"),
  useInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useInteractionMock = mockOf(useInteraction);
const useConfigMock = mockOf(useConfig);

describe("useRequiredTokensForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    useConfigMock.mockReturnValue(configs[Env.Localnet]);
  });

  it("should return required ecosystems for ETH to SOL Swap", async () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-ethereum-usdc",
    ]);
  });

  it("should return required ecosystems for SOL to ETH Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-ethereum-usdc",
    ]);
  });

  it("should return required ecosystems for SOL to SOL Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_SOL_USDT_SWAP.id),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-solana-usdt",
    ]);
  });

  it("should return required ecosystems for BSC to ETH Swap", async () => {
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
