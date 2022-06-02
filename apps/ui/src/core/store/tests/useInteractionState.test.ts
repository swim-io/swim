import { act, renderHook } from "@testing-library/react-hooks";

import { useInteractionState } from "..";
import { Env } from "../../../config";
import {
  MOCK_INTERACTION_STATE,
  MOCK_PREPARED_INTERACTION_STATE,
} from "../../../fixtures/swim/interactionState";
import {
  deserializeInteractionStates,
  prepareInteractionState,
} from "../idb/helpers";

describe("useInteraction", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("initially returns empty interactionStates array", async () => {
    const { result } = renderHook(() => useInteractionState());
    const partialState = {
      errorMap: {},
      interactionStates: [],
      recentInteractionId: null,
    };
    expect(result.current).toEqual(expect.objectContaining(partialState));
  });
  it("adds new interactionStates in store", async () => {
    const { result } = renderHook(() => useInteractionState());

    act(() => {
      result.current.addInteractionState(MOCK_INTERACTION_STATE);
    });

    expect(result.current.interactionStates).toEqual([MOCK_INTERACTION_STATE]);
    expect(result.current.recentInteractionId).toEqual(
      MOCK_INTERACTION_STATE.interaction.id,
    );
  });
  // it("loads interactions from IndexedDB into the state", async () => {
  //   const { result } = renderHook(() => useInteractionState());

  //   await act(async () => {
  //     await result.current.getInteractionStatesFromIDB(Env.CustomLocalnet);
  //   });

  //   expect(result.current.interactionStates).toEqual([MOCK_INTERACTION_STATE]);
  // });
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
  it("sets interaction error", () => {
    const { result } = renderHook(() => useInteractionState());

    act(() => {
      result.current.setInteractionError(
        "errorId",
        new Error("Failed interaction"),
      );
    });
    expect(result.current.errorMap).toEqual({
      errorId: new Error("Failed interaction"),
    });
  });
  it("gets interaction error", () => {
    const { result } = renderHook(() => useInteractionState());
    let error;

    act(() => {
      error = result.current.getInteractionError("errorId");
    });
    expect(error).toEqual(new Error("Failed interaction"));
  });
});

describe("idb helpers", () => {
  it("should serialize Swap interaction state", () => {
    const preparedSwap = prepareInteractionState(MOCK_INTERACTION_STATE);
    expect(preparedSwap).toEqual(MOCK_PREPARED_INTERACTION_STATE);
  });

  it("should deserialize prepared Swap interaction state", () => {
    const swap = deserializeInteractionStates(
      [MOCK_PREPARED_INTERACTION_STATE],
      Env.CustomLocalnet,
    );
    expect(swap).toEqual([MOCK_INTERACTION_STATE]);
  });
});
