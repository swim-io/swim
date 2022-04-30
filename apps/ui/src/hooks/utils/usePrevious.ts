import { useEffect, useRef } from "react";

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    ref.current = value;
  }, [value]);
  return ref.current;
};
