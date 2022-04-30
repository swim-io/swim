import type { EuiCardProps } from "@elastic/eui";
import { EuiCard } from "@elastic/eui";
import type { FunctionComponent, ReactElement } from "react";

import "./GlassPanel.scss";

export const GlassPanel: FunctionComponent<EuiCardProps> = ({
  children,
  ...rest
}): ReactElement => (
  <EuiCard className="glassPanel__container" display="transparent" {...rest}>
    {children}
  </EuiCard>
);
