import { useEffect } from "react";

export const useTitle = (title: string): void => {
  const companyName = "Swim";
  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    document.title = title === "" ? companyName : `${title} | ${companyName}`;
  }, [title]);
};
