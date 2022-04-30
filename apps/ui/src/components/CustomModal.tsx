/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { EuiModalProps } from "@elastic/eui";
import {
  EuiButtonIcon,
  EuiFocusTrap,
  EuiI18n,
  EuiOverlayMask,
  keys,
} from "@elastic/eui";
import classnames from "classnames";
import type { FunctionComponent } from "react";
import type React from "react";

export const CustomModal: FunctionComponent<EuiModalProps> = ({
  className,
  children,
  initialFocus,
  onClose,
  maxWidth = true,
  style,
  ...rest
}) => {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === keys.ESCAPE) {
      event.preventDefault();
      event.stopPropagation();
      onClose(event);
    }
  };

  let newStyle;
  let widthClassName;
  if (maxWidth === true) {
    widthClassName = "euiModal--maxWidth-default";
  } else if (maxWidth !== false) {
    const value = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
    newStyle = { ...style, maxWidth: value };
  }

  const classes = classnames("euiModal", widthClassName, className);

  return (
    <EuiOverlayMask onClick={onClose}>
      <EuiFocusTrap initialFocus={initialFocus}>
        {
          // Create a child div instead of applying these props directly to FocusTrap, or else
          // fallbackFocus won't work.
        }
        <div
          className={classes}
          onKeyDown={onKeyDown}
          tabIndex={0}
          style={newStyle || style}
          {...rest}
        >
          <EuiI18n
            token="euiModal.closeModal"
            default="Closes this modal window"
          >
            {(closeModal: string) => (
              <EuiButtonIcon
                iconType="cross"
                onClick={onClose}
                className="euiModal__closeIcon"
                color="text"
                aria-label={closeModal}
              />
            )}
          </EuiI18n>
          <div className="euiModal__flex">{children}</div>
        </div>
      </EuiFocusTrap>
    </EuiOverlayMask>
  );
};
