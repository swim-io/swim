import { EuiConfirmModal } from "@elastic/eui";
import type { ReactElement, ReactNode } from "react";

export interface ConfirmModalProps {
  readonly isVisible: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly titleText: string;
  readonly cancelText: string;
  readonly confirmText: string;
  readonly promptText: ReactNode;
}

export const ConfirmModal = ({
  isVisible,
  onCancel,
  onConfirm,
  titleText,
  cancelText,
  confirmText,
  promptText,
}: ConfirmModalProps): ReactElement =>
  isVisible ? (
    <EuiConfirmModal
      title={titleText}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelButtonText={cancelText}
      confirmButtonText={confirmText}
      defaultFocusedButton="confirm"
    >
      <p>{promptText}</p>
    </EuiConfirmModal>
  ) : (
    <></>
  );
