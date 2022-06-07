import { act, renderHook } from "@testing-library/react-hooks";

import { useInteractionState } from "..";
import { MOCK_INTERACTION_STATE } from "../../../fixtures/swim/interactionState";
import { ETH_USDC_TO_SOL_USDC_SWAP } from "../../../fixtures/swim/interactions";

jest.mock("../idb", () => ({
  ...jest.requireActual("../idb"),
  getInteractionStatesFromDb: jest.fn(),
  addInteractionStateToDb: jest.fn(),
}));

describe("useInteraction", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("initially returns empty interactionStates array", () => {
    const { result } = renderHook(() => useInteractionState());
    const partialState = {
      errorMap: {},
      interactionStates: [],
      recentInteractionId: null,
    };
    expect(result.current).toEqual(expect.objectContaining(partialState));
  });
  it("adds new interactionStates in store", () => {
    const { result } = renderHook(() => useInteractionState());
    const NEW_INTERACTION_STATE = {
      ...MOCK_INTERACTION_STATE,
      interaction: ETH_USDC_TO_SOL_USDC_SWAP,
    };

    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
      result.current.addInteractionState(NEW_INTERACTION_STATE);
    });

    expect(result.current.interactionStates).toEqual([
      MOCK_INTERACTION_STATE,
      NEW_INTERACTION_STATE,
    ]);
    expect(result.current.recentInteractionId).toEqual(
      NEW_INTERACTION_STATE.interaction.id,
    );
  });
  it("runs updateInteractionState and calls the update callback function", () => {
    const { result } = renderHook(() => useInteractionState());
    const mockUpdateCB = jest.fn();

    act(() => {
      result.current.updateInteractionState(
        "5eed9eef597a2aa14314845afe87079f",
        mockUpdateCB,
      );
    });
    expect(mockUpdateCB).toBeCalledTimes(1);
  });
  it("sets interaction error", () => {
    const { result } = renderHook(() => useInteractionState());
    const error = new Error("Failed interaction");

    act(() => {
      result.current.setInteractionError("errorId", error);
    });
    expect(result.current.errorMap).toEqual({
      errorId: error,
    });
  });
});
