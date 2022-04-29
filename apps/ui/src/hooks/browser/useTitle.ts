import { useEffect } from "react";

export const useTitle = (title: string): void => {
  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    document.title = title === "" ? "Swim" : title + " | Swim";
  }, [title]);
};
