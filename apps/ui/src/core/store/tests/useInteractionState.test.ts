import { act, renderHook } from "@testing-library/react-hooks";
import { useInteractionState } from "..";
import { MOCK_INTERACTION_STATE } from "../../../fixtures/swim/interactionState";

describe("useInteraction", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("initially returns empty interactionStates array", async () => {
    const { result } = renderHook(() => useInteractionState());
    expect(result.current.interactionStates).toEqual([]);
  });
  it("adds new interactionStates in store", async () => {
    const { result } = renderHook(() => useInteractionState());

    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
    });

    expect(result.current.interactionStates).toEqual([MOCK_INTERACTION_STATE]);
  });
  it("runs updateInteractionState and calls the update callback function", async () => {
    const { result } = renderHook(() => useInteractionState());
    const mockUpdateCB = jest.fn();

    act(() => {
      result.current.updateInteractionState(
        "5eed9eef597a2aa14314845afe87079f",
        mockUpdateCB,
      );
    });
    expect(mockUpdateCB).toBeCalled();
  });
});
