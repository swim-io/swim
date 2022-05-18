import { useEffect, useState } from "react";

import { useEnvironment } from "../../core/store";

export const useHydration = () => {
  const [hydrated, setHydrated] = useState(useEnvironment.persist.hasHydrated);

  useEffect(() => {
    const unsubHydrate = useEnvironment.persist.onHydrate(() =>
      setHydrated(false),
    ); // Note: this is just in case you want to take into account manual rehydrations. You can remove this if you don't need it/don't want it.
    const unsubFinishHydration = useEnvironment.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    setHydrated(useEnvironment.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
