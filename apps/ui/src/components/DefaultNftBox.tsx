import { EuiFlexGroup, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type { ReactElement } from "react";

import { EcosystemId } from "../config";

import { ConnectButton } from "./ConnectButton";

import "./DefaultNftBox.scss";

export interface DefaultNftBoxProps {
  readonly nftStatus: NftStatus;
}

export const enum NftStatus {
  NoWallet,
  Loading,
  Empty,
  Invalid,
}

const BoxText = ({ nftStatus }: DefaultNftBoxProps): ReactElement => {
  switch (nftStatus) {
    case NftStatus.NoWallet:
      return <p>Connect your wallet to view and redeem your Otter Tots!</p>;
    case NftStatus.Loading:
      return <EuiLoadingSpinner size="xl" />;
    case NftStatus.Empty:
      return <p>Get an Otter Tot to view and redeem here!</p>;
    case NftStatus.Invalid:
      return <p>Received an invalid input!</p>;
  }
};

export const DefaultNftBox = ({
  nftStatus,
}: DefaultNftBoxProps): ReactElement => {
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      direction="column"
      className="redeemPageBlueBox"
    >
      <BoxText nftStatus={nftStatus} />
      <EuiSpacer />
      <ConnectButton size="s" ecosystemId={EcosystemId.Solana} />
    </EuiFlexGroup>
  );
};
