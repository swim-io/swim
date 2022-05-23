import { useEffect, useState } from "react";

export const useHydration = (store: any) => {
  const [hydrated, setHydrated] = useState(store.persist.hasHydrated);

  useEffect(() => {
    const unsubHydrate = store.persist.onHydrate(() => setHydrated(false)); // Note: this is just in case you want to take into account manual rehydrations. You can remove this if you don't need it/don't want it.
    const unsubFinishHydration = store.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    setHydrated(store.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
