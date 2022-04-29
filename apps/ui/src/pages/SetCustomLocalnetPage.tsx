import type { ReactElement } from "react";
import { Redirect, useLocation } from "react-router";

import { useLocalStorageState } from "../hooks";

const SetCustomLocalnetPage = (): ReactElement => {
  const [, setCustomLocalnetIp] = useLocalStorageState<string | null>(
    "customLocalnetIp",
    null,
  );
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newLocalnetIp = searchParams.get("ip") ?? null;

  setCustomLocalnetIp(newLocalnetIp);

  return <Redirect to="/" />;
};

export default SetCustomLocalnetPage;
