import { EuiFlexGroup, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type { ReactElement } from "react";

import { EcosystemId } from "../config";

import { ConnectButton } from "./ConnectButton";

import "./DefaultNftBox.scss";

export interface DefaultNftBoxProps {
  readonly isWalletConnected: boolean;
  readonly isQueryLoading: boolean;
  readonly hasNoNfts: boolean;
}

const boxText = (
  isWalletConnected: boolean,
  isQueryLoading: boolean,
  hasNoNfts: boolean,
): ReactElement => {
  if (!isWalletConnected) {
    return <p>Connect your wallet to view and redeem your Otter Tots!</p>;
  }
  if (isQueryLoading) {
    return <EuiLoadingSpinner size="xl" />;
  }
  if (hasNoNfts) {
    return <p>Get an Otter Tot to view and redeem here!</p>;
  }
  throw new Error(
    "Connected wallet with NFTs but attempted to display text instead of showing NFTs",
  );
};

export const DefaultNftBox = ({
  isWalletConnected,
  isQueryLoading,
  hasNoNfts,
}: DefaultNftBoxProps): ReactElement => {
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      direction="column"
      className="redeemPageBlueBox"
    >
      {boxText(isWalletConnected, isQueryLoading, hasNoNfts)}
      <EuiSpacer />
      <ConnectButton size="s" ecosystemId={EcosystemId.Solana} />
    </EuiFlexGroup>
  );
};
