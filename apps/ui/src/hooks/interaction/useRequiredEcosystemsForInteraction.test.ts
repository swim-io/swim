import { renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { AppContext } from "../../contexts/appContext";
import {
  BSC_USDT_TO_ETH_USDC_SWAP,
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_SOL_USDT_SWAP,
} from "../../fixtures/swim/interactions";
import { mockOf } from "../../testUtils";

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
    renderHook(() => useQueryClient().clear(), {
      wrapper: AppContext,
    });
  });

  it("should return required ecosystems for ETH to SOL Swap", async () => {
    useInteractionMock.mockReturnValue(ETH_USDC_TO_SOL_USDC_SWAP);
    const { result } = renderHook(
      () => useRequiredEcosystemsForInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to ETH Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_ETH_USDC_SWAP);
    const { result } = renderHook(
      () => useRequiredEcosystemsForInteraction(SOL_USDC_TO_ETH_USDC_SWAP.id),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana]),
    );
  });

  it("should return required ecosystems for SOL to SOL Swap", async () => {
    useInteractionMock.mockReturnValue(SOL_USDC_TO_SOL_USDT_SWAP);
    const { result } = renderHook(
      () => useRequiredEcosystemsForInteraction(SOL_USDC_TO_SOL_USDT_SWAP.id),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(new Set([EcosystemId.Solana]));
  });

  it("should return required ecosystems for BSC to ETH Swap", async () => {
    useInteractionMock.mockReturnValue(BSC_USDT_TO_ETH_USDC_SWAP);
    const { result } = renderHook(
      () => useRequiredEcosystemsForInteraction(BSC_USDT_TO_ETH_USDC_SWAP.id),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(
      new Set([EcosystemId.Ethereum, EcosystemId.Solana, EcosystemId.Bsc]),
    );
  });
});
