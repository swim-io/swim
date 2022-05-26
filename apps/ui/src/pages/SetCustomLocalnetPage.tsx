import type { ReactElement } from "react";
import { Redirect, useLocation } from "react-router";

import { useEnvironment } from "../core/store";

const SetCustomLocalnetPage = (): ReactElement => {
  const { setCustomLocalnetIp } = useEnvironment();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newLocalnetIp = searchParams.get("ip") ?? null;

  setCustomLocalnetIp(newLocalnetIp);

  return <Redirect to="/" />;
};

export default SetCustomLocalnetPage;
