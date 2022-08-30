import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router";

import { useEnvironment } from "../core/store";

const SetCustomIpPage = (): ReactElement => {
  const { setCustomIp } = useEnvironment();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newIp = searchParams.get("ip") ?? null;

  setCustomIp(newIp);

  return <Navigate to="/" replace />;
};

export default SetCustomIpPage;
