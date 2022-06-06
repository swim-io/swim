import {
  MOCK_INTERACTION_STATE,
  MOCK_PREPARED_INTERACTION_STATE,
} from "../../../fixtures/swim/interactionState";

import {
  deserializeInteractionState,
  prepareInteractionState,
} from "./helpers";

describe("idb helpers", () => {
  it("should serialize Swap interaction state", () => {
    const preparedSwap = prepareInteractionState(MOCK_INTERACTION_STATE);
    expect(preparedSwap).toEqual(MOCK_PREPARED_INTERACTION_STATE);
  });

  it("should deserialize prepared Swap interaction state", () => {
    const swap = deserializeInteractionState(MOCK_PREPARED_INTERACTION_STATE);
    expect(swap).toEqual(MOCK_INTERACTION_STATE);
  });
});
