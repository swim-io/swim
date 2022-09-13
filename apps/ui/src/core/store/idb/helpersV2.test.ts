import {
  MOCK_SERIALIZED_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
  SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
} from "../../../fixtures/swim/interactionStateV2";

import {
  deserializeInteractionStateV2,
  serializeInteractionStateV2,
} from "./helpersV2";

describe("idb helpers", () => {
  it("should serialize Swap interaction state V2", () => {
    const preparedSwap = serializeInteractionStateV2(
      SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
    expect(preparedSwap).toEqual(
      MOCK_SERIALIZED_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
  });

  it("should deserialize Swap interaction state V2", () => {
    const swap = deserializeInteractionStateV2(
      MOCK_SERIALIZED_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    );
    expect(swap).toEqual(SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT);
  });
});
