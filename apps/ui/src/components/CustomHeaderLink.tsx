import type { EuiHeaderLinkProps } from "@elastic/eui";
import { EuiHeaderLink } from "@elastic/eui";
import type { ReactElement } from "react";
import { NavLink, useLocation } from "react-router-dom";

export type CustomHeaderLinkProps = EuiHeaderLinkProps & {
  readonly to: string;
};

// wrap EuiHeaderLink to enable react-router
export const CustomHeaderLink = ({
  to,
  ...rest
}: CustomHeaderLinkProps): ReactElement => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <NavLink to={to}>
      <EuiHeaderLink {...rest} isActive={isActive} />
    </NavLink>
  );
};
