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

import { useRequiredTokensForInteraction } from "./useRequiredTokensForInteraction";

jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useConfig: jest.fn(),
}));

// Make typescript happy with jest
const useConfigMock = mockOf(useConfig);

describe("useRequiredTokensForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
    useConfigMock.mockReturnValue(configs[Env.Localnet]);
  });

  it("should return required tokens for ETH USDC to SOL USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(ETH_USDC_TO_SOL_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-ethereum-usdc",
      "localnet-solana-usdc",
    ]);
  });

  it("should return required tokens for SOL USDC to ETH USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_ETH_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-ethereum-usdc",
    ]);
  });

  it("should return required tokens for SOL USDC to SOL USDT Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(SOL_USDC_TO_SOL_USDT_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-solana-usdc",
      "localnet-solana-usdt",
    ]);
  });

  it("should return required tokens for BSC USDT to ETH USDC Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredTokensForInteraction(BSC_USDT_TO_ETH_USDC_SWAP),
    );
    expect(result.current.map(({ id }) => id)).toEqual([
      "localnet-bsc-usdt",
      "localnet-ethereum-usdc",
    ]);
  });
});
