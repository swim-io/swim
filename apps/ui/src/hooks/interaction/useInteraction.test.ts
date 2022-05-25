import { useQueryClient } from "react-query";

import {
  ETH_USDC_TO_SOL_USDC_SWAP,
  SWAP_INTERACTIONS,
} from "../../fixtures/swim/interactions";
import { loadInteractions } from "../../models";
import { mockOf, renderHookWithAppContext } from "../../testUtils";

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
    renderHookWithAppContext(() => useQueryClient().clear());
  });

  it("should return found interaction", async () => {
    loadInteractionsMock.mockReturnValue(SWAP_INTERACTIONS);
    const { result } = renderHookWithAppContext(() =>
      useInteraction(ETH_USDC_TO_SOL_USDC_SWAP.id),
    );
    expect(result.current).toEqual(ETH_USDC_TO_SOL_USDC_SWAP);
  });

  it("should throw if interaction not found", async () => {
    loadInteractionsMock.mockReturnValue(SWAP_INTERACTIONS);
    const { result } = renderHookWithAppContext(() =>
      useInteraction("INVALID_ID"),
    );
    expect(result.error?.message).toEqual("Interaction not found");
  });
});
