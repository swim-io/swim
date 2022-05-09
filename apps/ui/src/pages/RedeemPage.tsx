import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { DefaultNftBox, NftStatus } from "../components/DefaultNftBox";
import { NftCarousel } from "../components/NftCarousel";
import { useTitle, useWallets } from "../hooks";
import type { NftData } from "../hooks/solana/useAccountNftsQuery";
import { useAccountNfts } from "../hooks/solana/useAccountNftsQuery";

const RedeemPage = (): ReactElement => {
  const title = "Redeem";
  useTitle(title);
  const wallets = useWallets();

  const { isLoading, data: nfts } = useAccountNfts(wallets.solana.address);
  const hasNfts =
    wallets.solana.connected && !isLoading && nfts && nfts.length !== 0;

  const nftStatus = !wallets.solana.connected
    ? NftStatus.NoWallet
    : isLoading
    ? NftStatus.Loading
    : !nfts || nfts.length === 0
    ? NftStatus.Empty
    : NftStatus.Invalid;

  return (
    <EuiPage className="redeemPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiSpacer />
            {hasNfts ? (
              <span>
                <EuiSpacer />
                <NftCarousel nfts={nfts as readonly NftData[]} />
              </span>
            ) : (
              <DefaultNftBox nftStatus={nftStatus} />
            )}
            <EuiSpacer />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default RedeemPage;
