import type { EuiHeaderLinkProps } from "@elastic/eui";
import { EuiHeaderLink } from "@elastic/eui";
import type { ReactElement } from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

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
    <Link to={to}>
      <EuiHeaderLink {...rest} isActive={isActive} />
    </Link>
  );
};
