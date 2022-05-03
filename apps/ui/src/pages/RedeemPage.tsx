import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { DefaultNftBox } from "../components/DefaultNftBox";
import { NftCarousel } from "../components/NftCarousel";
import { useTitle, useWallets } from "../hooks";
import { useAccountNfts } from "../hooks/solana/useAccountNftsQuery";

const RedeemPage = (): ReactElement => {
  const title = "Redeem";
  useTitle(title);
  const wallets = useWallets();

  const { isLoading, data: nfts } = useAccountNfts(wallets.solana.address);

  return (
    <EuiPage restrictWidth={700} className="redeemPage">
      <EuiPageBody style={{ maxWidth: "1200px" }}>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiSpacer />
            {wallets.solana.connected &&
            !isLoading &&
            nfts &&
            nfts.length !== 0 ? (
              <span>
                <EuiSpacer />
                <NftCarousel nfts={nfts} />
              </span>
            ) : (
              <DefaultNftBox
                isWalletConnected={wallets.solana.connected}
                isQueryLoading={isLoading}
                hasNoNfts={!nfts || nfts.length === 0}
              />
            )}
            <EuiSpacer />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default RedeemPage;
