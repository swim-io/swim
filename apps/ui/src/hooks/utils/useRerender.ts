import { useCallback, useState } from "react";

export const useRerender = () => {
  const [, setSignal] = useState({});
  const rerender = useCallback(() => {
    setSignal({});
  }, []);
  return rerender;
};
