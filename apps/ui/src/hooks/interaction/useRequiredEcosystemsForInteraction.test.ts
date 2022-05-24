import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import {
  BSC_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_SOL_USDT_SWAP,
} from "../../fixtures/swim/interactions";
import { renderHookWithAppContext } from "../../testUtils";

import { useRequiredEcosystemsForInteraction } from "./useRequiredEcosystemsForInteraction";

describe("useRequiredEcosystemsForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  it("should return required ecosystems for ETH to SOL Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(ETH_USDC_TO_SOL_USDC_SWAP),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to ETH Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(SOL_USDC_TO_ETH_USDC_SWAP),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to SOL Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(SOL_USDC_TO_SOL_USDT_SWAP),
    );
    expect(result.current).toEqual(new Set([EcosystemId.Solana]));
  });

  it("should return required ecosystems for BSC to ETH Swap", async () => {
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(BSC_USDT_TO_ETH_USDC_SWAP),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana, EcosystemId.Bsc]),
    );
  });
});
