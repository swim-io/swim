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

import type { WalletAdapter, WalletService } from "../models";
import { isUserOnMobileDevice } from "../utils";

import { CustomModal } from "./CustomModal";
import { MobileDeviceDisclaimer } from "./MobileDeviceDisclaimer";

export interface SingleWalletModalProps<
  W extends WalletService = WalletService,
> {
  readonly currentService: string;
  readonly services: readonly W[];
  readonly handleClose: () => void;
  readonly createServiceClickHandler: (
    serviceId: WalletService<WalletAdapter>["id"],
    callback?: () => any,
  ) => () => void;
}

export const SingleWalletModal = <W extends WalletService = WalletService>({
  currentService,
  services,
  handleClose,
  createServiceClickHandler,
}: SingleWalletModalProps<W>): ReactElement => (
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
              onClick={createServiceClickHandler(service.id, handleClose)}
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
