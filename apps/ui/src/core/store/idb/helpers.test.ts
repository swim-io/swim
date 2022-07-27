import {
  MOCK_INTERACTION_STATE,
  MOCK_PREPARED_INTERACTION_STATE,
} from "../../../fixtures/swim/interactionState";
import {
  MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
} from "../../../fixtures/swim/interactionStateV2";

import {
  deserializeInteractionState,
  deserializeInteractionStateV2,
  prepareInteractionState,
  prepareInteractionStateV2,
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

  it("should serialize Swap interaction state V2", () => {
    const preparedSwap = prepareInteractionStateV2(
      SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
    expect(preparedSwap).toEqual(
      MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
  });

  it("should deserialize Swap interaction state V2", () => {
    const swap = deserializeInteractionStateV2(
      MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
    expect(swap).toEqual(SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT);
  });
});
