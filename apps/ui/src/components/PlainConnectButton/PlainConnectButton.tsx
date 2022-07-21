import type {
  EuiButtonEmpty,
  EuiButtonProps,
  PropsForButton,
} from "@elastic/eui";
import { EuiButton, EuiIcon } from "@elastic/eui";
import classnames from "classnames";
import type { ReactElement } from "react";

import "./PlainConnectButton.scss";

export type PlainConnectButtonProps = Pick<
  PropsForButton<EuiButtonProps>,
  | "onClick"
  | "iconType"
  | "children"
  | "className"
  | "fullWidth"
  | "size"
  | "isDisabled"
> & {
  readonly color?: "success" | "primary";
  readonly connected: boolean;
  readonly helpText?: ReactElement;
  readonly ButtonComponent?: typeof EuiButton | typeof EuiButtonEmpty;
};

export const PlainConnectButton = ({
  ButtonComponent = EuiButton,
  children,
  connected,
  className,
  helpText,
  ...rest
}: PlainConnectButtonProps): ReactElement => (
  <ButtonComponent
    {...rest}
    className={classnames("plainConnectButton", className, {
      "plainConnectButton--connected": connected,
    })}
    iconSide="left"
  >
    <span>{children}</span>
    {helpText && <>{helpText}</>}
    <EuiIcon
      className="plainConnectButton__exitIcon"
      type="crossInACircleFilled"
      size="m"
    />
  </ButtonComponent>
);
