import { EuiSpacer, EuiText, EuiTextColor, EuiTitle } from "@elastic/eui";
import type { ReactElement } from "react";

import "./Roadmap.scss";

export const Roadmap = (): ReactElement => (
  <div className="roadmap">
    <div
      className="bubble"
      style={{ width: 180, height: 180, right: "5%", top: 180 }}
    ></div>
    <div
      className="bubble"
      style={{ width: 50, height: 50, right: "15%", top: 100 }}
    ></div>
    <div
      className="bubble"
      style={{ width: 150, height: 150, left: "5%", bottom: 50 }}
    ></div>
    <div className="timeline">
      <div className="timeline__item">
        <div className="timeline__date">
          <div>
            <EuiTitle size="s">
              <h3>
                <span>2022</span>
                <br />
                <span>Q3</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiText color="ghost">
            <span>Seamless single-click swapping</span>
            <br />
            <span>Integrating with other projects</span>
            <br />
            <span>Expanding to new chains</span>
          </EuiText>
        </div>
      </div>

      <div className="timeline__item">
        <div className="timeline__date">
          <div>
            <EuiTitle size="s">
              <h3>
                <span>2022</span>
                <br />
                <span>Q4</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiSpacer size="m" className="eui-hideFor--xs eui-hideFor--s" />
          <EuiText color="ghost">
            <span>Multi-chain native asset SDK</span>
            <br />
            <span>Numerous UX enhancements</span>
            <br />
            <span>Community Initiatives</span>
            <EuiSpacer size="m" />
          </EuiText>
        </div>
      </div>

      <div className="timeline__item">
        <div className="timeline__date">
          <div>
            <EuiTitle size="s">
              <h3>
                <span>2023</span>
                <br></br>
                <span>TBD</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiSpacer className="eui-hideFor--xs eui-hideFor--s" />
          <EuiText color="ghost">
            <span>$SWIM IDO</span>
            <br />
            <span>Governance</span>
            <EuiSpacer />
          </EuiText>
        </div>
      </div>
    </div>
  </div>
);
