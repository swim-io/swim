import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import SWIM_LOGO from "../../images/swim_logo.svg";

import "./CustomHeaderLogo.scss";

// re-create EuiHeaderLogo to enable react-router
export const CustomHeaderLogo = (): ReactElement => {
  return (
    <Link to="/" className="euiHeaderLogo">
      <EuiIcon
        size="l"
        type={SWIM_LOGO}
        style={{ width: "36px", height: "36px" }}
      />
      <span
        className="euiHeaderLogo__text"
        style={{ color: "#2065D8" }}
        // bypass i18next/no-literal-string
        // eslint-disable-next-line react/no-children-prop
        children="SWIM"
      />
    </Link>
  );
};
