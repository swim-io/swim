import type { ReactElement } from "react";
import { Redirect, useLocation } from "react-router";

import { selectSetCustomLocalnetIp } from "../core/selectors";
import { useEnvironmentStore } from "../core/store";

const SetCustomLocalnetPage = (): ReactElement => {
  const setCustomLocalIp = useEnvironmentStore(selectSetCustomLocalnetIp);
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newLocalnetIp = searchParams.get("ip") ?? null;

  setCustomLocalIp(newLocalnetIp);

  return <Redirect to="/" />;
};

export default SetCustomLocalnetPage;
