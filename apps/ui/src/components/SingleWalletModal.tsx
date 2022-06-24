import {
  EuiButtonEmpty,
  EuiIcon,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { Fragment } from "react";

import type { Protocol } from "../config";
import { useWalletService } from "../hooks/wallets";
import type { WalletService } from "../models";
import { isUserOnMobileDevice } from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";

export interface SingleWalletModalProps<
  W extends WalletService = WalletService,
> {
  readonly currentService: WalletService["id"] | null;
  readonly protocol: Protocol;
  readonly services: readonly W[];
  readonly handleClose: () => void;
}

export const SingleWalletModal = <W extends WalletService = WalletService>({
  currentService,
  protocol,
  services,
  handleClose,
}: SingleWalletModalProps<W>): ReactElement => {
  const { connectService } = useWalletService();
  return (
    <CustomModal onClose={handleClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Select Wallet</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {isUserOnMobileDevice() ? <MobileDeviceDisclaimer /> : ""}
        {services.map((service) => {
          const {
            id,
            info: { icon, name, helpText },
          } = service;
          return (
            <Fragment key={name}>
              <EuiButtonEmpty
                isSelected={currentService === id}
                onClick={() => {
                  void connectService({ serviceId: service.id, protocol });
                  handleClose();
                }}
              >
                <EuiIcon type={icon} size="l" style={{ marginRight: 8 }} />
                {name}
              </EuiButtonEmpty>
              {helpText && <>{helpText}</>}
              <EuiSpacer size="xs" />
            </Fragment>
          );
        })}
      </EuiModalBody>
    </CustomModal>
  );
};
