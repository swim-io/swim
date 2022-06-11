import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useEnvironment } from "../core/store";

const SetCustomLocalnetPage = (): ReactElement => {
  const { setCustomLocalnetIp } = useEnvironment();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const newLocalnetIp = searchParams.get("ip") ?? null;

  setCustomLocalnetIp(newLocalnetIp);

  return <Navigate to="/" replace={true} />;
};

export default SetCustomLocalnetPage;
