import { EuiIcon } from "@elastic/eui";
import type { ReactElement } from "react";

import SWIM_LOGO from "../images/swim_logo.svg";

// Using the Swim SVG to create an Eui usable IconType for buttons etc
export const SwimIconType = (): ReactElement => {
  return <EuiIcon size="l" type={SWIM_LOGO}></EuiIcon>;
};
