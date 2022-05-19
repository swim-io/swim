import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";

import { DefaultNftBox, NftProblem } from "../components/DefaultNftBox";
import { NftCarousel } from "../components/NftCarousel";
import { useSolanaWallet } from "../contexts";
import { useTitle } from "../hooks";
import { useAccountNfts } from "../hooks/solana/useAccountNftsQuery";

const RedeemPage = (): ReactElement => {
  const title = "Redeem";
  useTitle(title);
  const isConnected = useSolanaWallet().connected;
  const { isLoading, data: nfts = [], refetch } = useAccountNfts();

  const nftProblem = !isConnected
    ? NftProblem.NoWallet
    : isLoading
    ? NftProblem.Loading
    : nfts.length === 0
    ? NftProblem.Empty
    : null;

  return (
    <EuiPage className="redeemPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiSpacer />
            {nftProblem === null ? (
              <span>
                <EuiSpacer />
                <NftCarousel nfts={nfts} refetchNfts={refetch} />
              </span>
            ) : (
              <DefaultNftBox nftProblem={nftProblem} />
            )}
            <EuiSpacer />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default RedeemPage;
