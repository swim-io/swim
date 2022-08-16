import { EuiSpacer, EuiText, EuiTitle } from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import "./Roadmap.scss";

export const Roadmap = (): ReactElement => {
  const { t } = useTranslation();
  return (
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
                <h3 style={{ whiteSpace: "pre-line" }}>
                  {t("product_roadmap.2022_q3")}
                </h3>
              </EuiTitle>
            </div>
          </div>
          <div className="timeline__content">
            <EuiText color="ghost" style={{ whiteSpace: "pre-line" }}>
              {t("product_roadmap.2022_q3_deliverables")}
            </EuiText>
          </div>
        </div>

        <div className="timeline__item">
          <div className="timeline__date">
            <div>
              <EuiTitle size="s">
                <h3 style={{ whiteSpace: "pre-line" }}>
                  {t("product_roadmap.2022_q4")}
                </h3>
              </EuiTitle>
            </div>
          </div>
          <div className="timeline__content">
            <EuiSpacer size="m" className="eui-hideFor--xs eui-hideFor--s" />
            <EuiText color="ghost" style={{ whiteSpace: "pre-line" }}>
              {t("product_roadmap.2022_q4_deliverables")}
              <EuiSpacer size="m" />
            </EuiText>
          </div>
        </div>

        <div className="timeline__item">
          <div className="timeline__date">
            <div>
              <EuiTitle size="s">
                <h3 style={{ whiteSpace: "pre-line" }}>
                  {t("product_roadmap.2023_tbd")}
                </h3>
              </EuiTitle>
            </div>
          </div>
          <div className="timeline__content">
            <EuiSpacer className="eui-hideFor--xs eui-hideFor--s" />
            <EuiText color="ghost" style={{ whiteSpace: "pre-line" }}>
              {t("product_roadmap.2023_tbd_deliverables")}
              <EuiSpacer />
            </EuiText>
          </div>
        </div>
      </div>
    </div>
  );
};
