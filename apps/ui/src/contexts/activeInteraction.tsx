import constate from "constate";
import { useState } from "react";

const useActiveInteraction = (): {
  readonly hasActiveInteraction: boolean;
  readonly setActiveInteraction: (activeInteraction: string | null) => void;
} => {
  const [activeInteraction, setActiveInteraction] = useState<string | null>(
    null,
  );
  const hasActiveInteraction = activeInteraction !== null;
  return { hasActiveInteraction, setActiveInteraction };
};

const [ActiveInteractionProvider, useActiveInteractionContext] =
  constate(useActiveInteraction);

export { ActiveInteractionProvider, useActiveInteractionContext };
