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
                <span>Q1</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiTitle size="s">
            <h3>
              <EuiTextColor color="ghost">Launch</EuiTextColor>
            </h3>
          </EuiTitle>
          <EuiText color="ghost">
            <span>Swim Product Launch</span>
            <br />
            <span>Integrating & Collaborating with other leading projects</span>
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
                <span>Q2</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiSpacer size="m" className="eui-hideFor--xs eui-hideFor--s" />
          <EuiTitle size="s">
            <h3>
              <EuiTextColor color="ghost">More Chains</EuiTextColor>
            </h3>
          </EuiTitle>
          <EuiText color="ghost">
            <span>Integration with more chains</span>
            <br />
            <span>Volatile asset swap</span>
            <EuiSpacer size="m" />
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
                <span>Q3</span>
              </h3>
            </EuiTitle>
          </div>
        </div>
        <div className="timeline__content">
          <EuiSpacer className="eui-hideFor--xs eui-hideFor--s" />
          <EuiTitle size="s">
            <h3>
              <EuiTextColor color="ghost">The Future</EuiTextColor>
            </h3>
          </EuiTitle>
          <EuiText color="ghost">
            <span>Cross-chain project collaboration</span>
            <br />
            <span>Governance</span>
            <EuiSpacer />
          </EuiText>
        </div>
      </div>
    </div>
  </div>
);
