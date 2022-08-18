import { EuiFlexGroup, EuiLoadingSpinner, EuiSpacer } from "@elastic/eui";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  switch (nftProblem) {
    case NftProblem.NoWallet:
      return <p>{t("redeem_page.connect_wallet_to_redeem")}</p>;
    case NftProblem.Loading:
      return <EuiLoadingSpinner size="xl" />;
    case NftProblem.Empty:
      return <p>{t("redeem_page.redeem_here")}</p>;
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
      <ConnectButton size="s" ecosystemId={SOLANA_ECOSYSTEM_ID} />
    </EuiFlexGroup>
  );
};
