import type { ReactElement } from "react";
import { Redirect, useLocation } from "react-router";

import { selectSetCustomLocalnetIp } from "../core/selectors";
import { useEnvironment } from "../core/store";

const SetCustomLocalnetPage = (): ReactElement => {
  const setCustomLocalIp = useEnvironment(selectSetCustomLocalnetIp);
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newLocalnetIp = searchParams.get("ip") ?? null;

  setCustomLocalIp(newLocalnetIp);

  return <Redirect to="/" />;
};

export default SetCustomLocalnetPage;
