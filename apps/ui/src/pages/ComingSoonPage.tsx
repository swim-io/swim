import {
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { useTitle } from "../hooks";

const ComingSoonPage = (): ReactElement => {
  useTitle("Coming Soon");

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <div className="eui-textCenter">
          <EuiText color="ghost">
            <EuiTitle size="l">
              <h1 style={{ fontSize: "40px" }}>
                <EuiTextColor color="ghost">Coming Soon</EuiTextColor>
              </h1>
            </EuiTitle>
          </EuiText>
        </div>
      </EuiPageBody>
    </EuiPage>
  );
};

export default ComingSoonPage;
