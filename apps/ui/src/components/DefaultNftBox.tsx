import { EuiFlexGroup, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type { ReactElement } from "react";

import { ConnectButton } from "./ConnectButton";

import "./DefaultNftBox.scss";

export interface DefaultNftBoxProps {
  readonly nftProblem: NftProblem;
}

export const enum NftProblem {
  NoWallet,
  Loading,
  Empty,
}

const BoxText = ({ nftProblem }: DefaultNftBoxProps): ReactElement => {
  switch (nftProblem) {
    case NftProblem.NoWallet:
      return <p>Connect your wallet to view and redeem your Otter Tots!</p>;
    case NftProblem.Loading:
      return <EuiLoadingSpinner size="xl" />;
    case NftProblem.Empty:
      return <p>Get an Otter Tot to view and redeem here!</p>;
  }
};

export const DefaultNftBox = ({
  nftProblem,
}: DefaultNftBoxProps): ReactElement => {
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      direction="column"
      className="redeemPageBlueBox"
    >
      <BoxText nftProblem={nftProblem} />
      <EuiSpacer />
      <ConnectButton size="s" ecosystemId={SOLANA_ECOSYSTEM_ID} />
    </EuiFlexGroup>
  );
};
