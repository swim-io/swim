import { EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import type { ReactElement } from "react";

import ALAMEDA_SVG from "../images/partners/alameda-research.svg";
import BONFIDA_SVG from "../images/partners/bonfida.svg";
import COINBASE_SVG from "../images/partners/coinbase.svg";
import FTX_SVG from "../images/partners/ftx.svg";
import GBV_CAPITAL_SVG from "../images/partners/gbv-capital.svg";
import IOSG_VENTURES_SVG from "../images/partners/iosg-ventures.svg";
import JUMP_CAPITAL_SVG from "../images/partners/jump-capital.svg";
import MANTIS_SVG from "../images/partners/mantis.svg";
import PANONY_SVG from "../images/partners/panony.svg";
import PANTERA_SVG from "../images/partners/pantera.svg";
import ROK_CAPITAL_PNG from "../images/partners/rok-capital.png";
import SOCIAL_CAPITAL_SVG from "../images/partners/social-capital.svg";
import SOLANA_VENTURES_SVG from "../images/partners/solana-ventures.svg";

import "./InvestorsList.scss";

export const InvestorsList = (): ReactElement => {
  return (
    <div className="investorsList">
      <EuiFlexGroup responsive={false} wrap={true}>
        <EuiFlexItem>
          <img src={PANTERA_SVG} alt="Pantera" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img
            src={FTX_SVG}
            alt="FTX"
            style={{ paddingLeft: 20, paddingRight: 20 }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={ALAMEDA_SVG} alt="Alameda Research" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={COINBASE_SVG} alt="Coinbase Ventures" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={SOLANA_VENTURES_SVG} alt="Solana Ventures" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={JUMP_CAPITAL_SVG} alt="Jump Capital" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={SOCIAL_CAPITAL_SVG} alt="Social Capital" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={IOSG_VENTURES_SVG} alt="IOSG Ventures" />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup responsive={false} wrap={true}>
        <EuiFlexItem>
          <img
            src={ROK_CAPITAL_PNG}
            alt="ROK Capital"
            style={{ paddingLeft: 20, paddingRight: 20 }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={GBV_CAPITAL_SVG} alt="GBV Capital" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={MANTIS_SVG} alt="Mantis" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={PANONY_SVG} alt="Panony" />
        </EuiFlexItem>
        <EuiFlexItem>
          <img src={BONFIDA_SVG} alt="Bonfida" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
