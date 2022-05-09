import {
  EuiBasicTable,
  EuiButton,
  EuiConfirmModal,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiImage,
  EuiText,
} from "@elastic/eui";
import type { ChangeEvent, ReactElement } from "react";
import { useState } from "react";
// TODO: Replace with more repubtale/battle-tested carousel.
import Carousel from "react-elastic-carousel";
// import { Carousel } from "react-responsive-carousel";

import type {
  NftAttribute,
  NftData,
} from "../hooks/solana/useAccountNftsQuery";

import "./NftCarousel.scss";

export interface NftCarouselProps {
  readonly nfts: readonly NftData[];
}

export const NftCarousel = ({ nfts }: NftCarouselProps): ReactElement => {
  const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
  // TODO: Decide on a redeem password, current text reads:
  // "Type `redeem` to redeem your otter."
  const redeemPassword = "redeem";
  const [passwordInput, setPasswordInput] = useState("");
  const onRedeemInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPasswordInput(e.target.value);
  };
  // TODO: Query redeemer to set nft value.
  const nftValue = 100;

  const showRedeemModal = (): void => {
    setIsRedeemModalVisible(true);
  };

  const hideRedeemModal = (): void => {
    setIsRedeemModalVisible(false);
  };

  // TODO: This is unimplemented.
  const executeRedeem = (): void => {
    // eslint-disable-next-line no-console
    console.log("this would destroy the NFT.");
  };

  const columns = [
    {
      field: "traitType",
      name: "Trait Type",
    },
    {
      field: "value",
      name: "Trait",
    },
    {
      field: "rarity",
      name: "Rarity",
      render: (rarityNumber: any) => {
        return "🔥".repeat(rarityNumber);
      },
    },
  ];

  const cardFooterContent = (
    <EuiFlexGroup justifyContent="flexEnd">
      <EuiFlexItem grow={false}>
        <EuiButton onClick={showRedeemModal}>Redeem</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const generateTable = (attributes: readonly NftAttribute[]): ReactElement => {
    return (
      <EuiBasicTable
        tableCaption="Nft Traits"
        columns={columns}
        items={[...attributes]}
        rowHeader="traitType"
      />
    );
  };

  return (
    <>
      <Carousel isRTL={false}>
        {nfts.map((nft) => {
          return (
            <div key={nft.metadata.mint}>
              <EuiFlexGroup direction="column" alignItems="center">
                <EuiFlexItem>
                  <EuiImage src={nft.image} alt="" />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup direction="column">
                <EuiFlexItem>
                  <EuiText>
                    <h4>{nft.metadata.data.name}</h4>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>{generateTable(nft.attributes)}</EuiFlexItem>
                <EuiFlexItem>{cardFooterContent}</EuiFlexItem>
              </EuiFlexGroup>
            </div>
          );
        })}
      </Carousel>
      {isRedeemModalVisible && (
        <EuiConfirmModal
          title="Redeem your otter?"
          onCancel={hideRedeemModal}
          onConfirm={executeRedeem}
          confirmButtonText="Redeem"
          cancelButtonText="Cancel"
          buttonColor="danger"
          confirmButtonDisabled={passwordInput.toLowerCase() !== redeemPassword}
        >
          <EuiFormRow
            label={`Type the word "${redeemPassword}" to redeem for ${nftValue} SWIM tokens`}
          >
            <EuiFieldText
              name="delete"
              value={passwordInput}
              onChange={onRedeemInputChange}
            />
          </EuiFormRow>
        </EuiConfirmModal>
      )}
    </>
  );
};
