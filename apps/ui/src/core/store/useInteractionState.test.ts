import { act, renderHook } from "@testing-library/react-hooks";

import { MOCK_INTERACTION_STATE } from "../../fixtures/swim/interactionState";

import { useInteractionState } from "./useInteractionState";

describe("useInteractionState", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useInteractionState());
    act(() => {
      result.current.reset();
    });
  });

  it("initially returns empty interactionStates array", () => {
    const { result } = renderHook(() => useInteractionState());
    expect(result.current.interactionStates).toEqual([]);
  });

  it("should add new state with addInteractionState()", () => {
    const { result } = renderHook(() => useInteractionState());
    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
    });
    expect(result.current.interactionStates.length).toEqual(1);
    expect(result.current.interactionStates[0].interaction).toEqual(
      MOCK_INTERACTION_STATE.interaction,
    );
  });

  describe("with existing interaction state", () => {
    beforeEach(() => {
      const { result } = renderHook(() => useInteractionState());
      act(() => {
        result.current.reset();
        result.current.addInteractionState(MOCK_INTERACTION_STATE);
      });
    });

    describe("getInteractionState", () => {
      it("should get interaction state with existing id", () => {
        const { result } = renderHook(() => useInteractionState());
        const { id } = MOCK_INTERACTION_STATE.interaction;

        const resultInteractionState = result.current.getInteractionState(id);
        expect(resultInteractionState.interaction.id).toEqual(id);
      });

      it("should throw error if interaction not exist", () => {
        const { result } = renderHook(() => useInteractionState());
        expect(() =>
          result.current.getInteractionState("NOT_EXIST_ID"),
        ).toThrow("Interaction does not exist");
      });
    });

    it("should update interaction state with updateInteractionState", () => {
      const { result } = renderHook(() => useInteractionState());
      const { id } = MOCK_INTERACTION_STATE.interaction;
      act(() => {
        result.current.updateInteractionState(id, (draft) => {
          draft.solanaPoolOperations[0].txId = "MOCK_TX_ID";
        });
      });
      expect(result.current.interactionStates.length).toEqual(1);
      expect(
        result.current.interactionStates[0].solanaPoolOperations[0].txId,
      ).toEqual("MOCK_TX_ID");
    });
  });
});
