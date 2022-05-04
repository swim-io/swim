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
import { useRedeemMutation } from "../hooks/swim/useRedeemMutation";

import "./NftCarousel.scss";

export interface NftCarouselProps {
  readonly nfts: readonly NftData[];
}

export const NftCarousel = ({ nfts }: NftCarouselProps): ReactElement => {
  const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
  const [activeNft, setActiveNft] = useState<NftData | null>(null);
  // TODO: Decide on a redeem password, current text reads:
  // "Type `redeem` to redeem your otter."
  const redeemPassword = "redeem";
  const [redeemInput, setRedeemInput] = useState("");
  const onRedeemInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setRedeemInput(e.target.value);
  };

  const { mutateAsync } = useRedeemMutation(activeNft);

  const showRedeemModal = (nft: NftData): void => {
    setActiveNft(nft);
    setIsRedeemModalVisible(true);
  };

  const hideRedeemModal = (): void => {
    setIsRedeemModalVisible(false);
  };

  const executeRedeem = (): void => {
    // TODO: looks very wrong.. doex execute redeem need to be async?
    void mutateAsync(activeNft, {
      onError: (error) => {
        // TODO: throw a pop-up on failure.
        console.log("error!", error);
      },
      onSuccess: () => {
        console.log("success");
      },
    });
    hideRedeemModal();
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

  const cardFooterContent = (nft: NftData): ReactElement => {
    return (
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton onClick={() => showRedeemModal(nft)}>Redeem</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

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
              footer={cardFooterContent(nft)}
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
              "Type the word " +
              redeemPassword +
              " to redeem for ??? SWIM tokens"
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
