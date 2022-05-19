import { renderHook } from "@testing-library/react-hooks";
import { useQueryClient } from "react-query";

import { AppContext } from "../../contexts/appContext";
import {
  ETH_USDC_TO_SOL_USDC_SWAP,
  SWAP_INTERACTIONS,
} from "../../fixtures/swim/interactions";
import { loadInteractions } from "../../models";
import { mockOf } from "../../testUtils";

import { useInteraction } from "./useInteraction";

jest.mock("../../models", () => ({
  ...jest.requireActual("../../models"),
  loadInteractions: jest.fn(),
}));

// Make typescript happy with jest
const loadInteractionsMock = mockOf(loadInteractions);

describe("useInteraction", () => {
  beforeEach(() => {
    // Reset queryClient cache, otherwise test might return previous value
    renderHook(() => useQueryClient().clear(), {
      wrapper: AppContext,
    });
  });

  it("should return found interaction", async () => {
    loadInteractionsMock.mockReturnValue(SWAP_INTERACTIONS);
    const { result } = renderHook(
      () => useInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
      {
        wrapper: AppContext,
      },
    );
    expect(result.current).toEqual(ETH_USDC_TO_SOL_USDC_SWAP);
  });

  it("should throw if interaction not found", async () => {
    loadInteractionsMock.mockReturnValue(SWAP_INTERACTIONS);
    const { result } = renderHook(() => useInteraction("INVALID_ID"), {
      wrapper: AppContext,
    });
    expect(result.error?.message).toEqual("Interaction not found");
  });
});
