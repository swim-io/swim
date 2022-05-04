import {
  EuiBasicTable,
  EuiButton,
  EuiCard,
  EuiConfirmModal,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
} from "@elastic/eui";
import type { ChangeEvent, ReactElement } from "react";
import { useState } from "react";
// TODO: Replace with more repubtale/battle-tested carousel.
import Carousel from "react-elastic-carousel";

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
  const onRedeemInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setRedeemInput(e.target.value);
  };

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
      <Carousel itemsToShow={1} isRTL={false}>
        {nfts.map((nft) => {
          return (
            <EuiCard
              key={nft.metadata.data.name}
              textAlign="left"
              image={nft.image}
              title={nft.metadata.data.name}
              description={generateTable(nft.attributes)}
              footer={cardFooterContent}
            />
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
          confirmButtonDisabled={redeemInput.toLowerCase() !== redeemPassword}
        >
          <EuiFormRow
            // TODO: Set value of NFT. This will need to be a query.
            label={
              `Type the word "${redeemPassword}" to redeem for ??? SWIM tokens`
            }
          >
            <EuiFieldText
              name="delete"
              value={redeemInput}
              onChange={onRedeemInput}
            />
          </EuiFormRow>
        </EuiConfirmModal>
      )}
    </>
  );
};
