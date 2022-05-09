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

import type {
  NftAttribute,
  NftData,
} from "../hooks/solana/useAccountNftsQuery";

import "./NftCarousel.scss";

export interface NftCarouselProps {
  readonly nfts: readonly NftData[];
}

const rarityColumns = [
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

  const showRedeemModal = setIsRedeemModalVisible.bind(null, true);

  const hideRedeemModal = (): void => {
    setIsRedeemModalVisible(false);
  };

  // TODO: This is unimplemented.
  const executeRedeem = (): void => {
    // eslint-disable-next-line no-console
    console.log("this would destroy the NFT.");
  };

  const generateTable = (attributes: readonly NftAttribute[]): ReactElement => (
    <EuiBasicTable
      tableCaption="Nft Traits"
      columns={rarityColumns}
      items={[...attributes]}
      rowHeader="traitType"
    />
  );

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
              </EuiFlexGroup>
              <EuiFlexGroup justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButton onClick={showRedeemModal}>Redeem</EuiButton>
                </EuiFlexItem>
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
              name="redeem"
              value={passwordInput}
              onChange={onRedeemInputChange}
            />
          </EuiFormRow>
        </EuiConfirmModal>
      )}
    </>
  );
};
