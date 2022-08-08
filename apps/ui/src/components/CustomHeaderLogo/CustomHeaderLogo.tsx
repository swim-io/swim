import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import SWIM_LOGO from "../../images/swim_logo.svg";

import "./CustomHeaderLogo.scss";

// re-create EuiHeaderLogo to enable react-router
export const CustomHeaderLogo = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <Link to="/" className="euiHeaderLogo">
      <EuiIcon
        size="l"
        type={SWIM_LOGO}
        style={{ width: "36px", height: "36px" }}
      />
      <span className="euiHeaderLogo__text" style={{ color: "#2065D8" }}>
        {t("general.company_name_in_logo")}
      </span>
    </Link>
  );
};
