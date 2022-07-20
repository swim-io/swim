import type { InteractionStoreV2 } from "../store";

export const selectInteractionErrorV2 = (
  state: InteractionStoreV2,
  id: string,
): Error | undefined => state.errorMap[id];
