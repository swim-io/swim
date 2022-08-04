import { EuiFlexGroup, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import type { ReactElement } from "react";

import { EcosystemId } from "../../config";
import { ConnectButton } from "../ConnectButton";

import "./DefaultNftBox.scss";

interface Props {
  readonly nftProblem: NftProblem;
}

export const enum NftProblem {
  NoWallet,
  Loading,
  Empty,
}

const BoxText = ({ nftProblem }: Props): ReactElement => {
  switch (nftProblem) {
    case NftProblem.NoWallet:
      return <p>Connect your wallet to view and redeem your Otter Tots!</p>;
    case NftProblem.Loading:
      return <EuiLoadingSpinner size="xl" />;
    case NftProblem.Empty:
      return <p>Get an Otter Tot to view and redeem here!</p>;
  }
};

export const DefaultNftBox = ({ nftProblem }: Props): ReactElement => {
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      direction="column"
      className="redeemPageBlueBox"
    >
      <BoxText nftProblem={nftProblem} />
      <EuiSpacer />
      <ConnectButton size="s" ecosystemId={EcosystemId.Solana} />
    </EuiFlexGroup>
  );
};
