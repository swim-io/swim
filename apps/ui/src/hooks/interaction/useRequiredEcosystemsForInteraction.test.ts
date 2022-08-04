import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import {
  BNB_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_SOL_USDT_SWAP,
} from "../../fixtures/swim/interactions";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

import { useInteraction } from "./useInteraction";
import { useRequiredEcosystemsForInteraction } from "./useRequiredEcosystemsForInteraction";

jest.mock("./useInteraction", () => ({
  ...jest.requireActual("./useInteraction"),
  useInteraction: jest.fn(),
}));

// Make typescript happy with jest
const useInteractionMock = mockOf(useInteraction);

describe("useRequiredEcosystemsForInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  it("should return required ecosystems for ETH to SOL Swap", () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to ETH Swap", () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(SOL_USDC_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to SOL Swap", () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(SOL_USDC_TO_SOL_USDT_SWAP.id),
    );
    expect(result.current).toEqual(new Set([EcosystemId.Solana]));
  });

  it("should return required ecosystems for BNB to ETH Swap", () => {
    useInteractionMock.mockReturnValue(BNB_USDT_TO_ETH_USDC_SWAP);
    const { result } = renderHookWithAppContext(() =>
      useRequiredEcosystemsForInteraction(BNB_USDT_TO_ETH_USDC_SWAP.id),
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana, EcosystemId.Bnb]),
    );
  });
});
