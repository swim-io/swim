import { useIsMutating } from "react-query";

import { INTERACTION_MUTATION_KEY } from "./useInteractionMutation";

export const useHasActiveInteraction = () => {
  const count = useIsMutating({
    predicate: (mutation) =>
      mutation.options.mutationKey === INTERACTION_MUTATION_KEY,
  });
  if (count > 1) {
    throw new Error("Only 1 interaction can happen at a time");
  }
  return count === 1;
};
