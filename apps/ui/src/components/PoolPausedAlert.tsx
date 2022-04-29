import { EuiButton, EuiCallOut, EuiPanel } from "@elastic/eui";
import type { ReactElement } from "react";

export const PoolPausedAlert = ({
  isVisible,
}: {
  readonly isVisible: boolean;
}): ReactElement => {
  if (!isVisible) {
    return <></>;
  }

  return (
    <EuiPanel hasShadow={false} style={{ paddingLeft: 0, paddingRight: 0 }}>
      <EuiCallOut title="Pool Paused" color="danger" iconType="alert">
        <p>The required pool is currently paused. Please try again later.</p>
        <EuiButton
          href="/help"
          onClick={(e) => {
            e.preventDefault();
            window.open("/help", "_blank");
          }}
          color="warning"
          iconType="popout"
          iconSide="right"
          size="s"
        >
          Get help
        </EuiButton>
      </EuiCallOut>
    </EuiPanel>
  );
};
