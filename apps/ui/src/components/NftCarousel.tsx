import {
  EuiBasicTable,
  EuiButton,
  EuiButtonIcon,
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
import { Carousel } from "react-responsive-carousel";

import type {
  NftAttribute,
  NftData,
} from "../hooks/solana/useAccountNftsQuery";

import "./NftCarousel.scss";
import "react-responsive-carousel/lib/styles/carousel.min.css";

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
  const redeemPassword = "redeem";
  const [passwordInput, setPasswordInput] = useState("");
  const onRedeemInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPasswordInput(e.target.value);
  };
  // TODO: Query redeemer to retrieve value of otter (amount and token).
  const redeemerValue = 100;
  const redeemerToken = "USDC";

  const showRedeemModal = setIsRedeemModalVisible.bind(null, true);

  const hideRedeemModal = (): void => {
    setIsRedeemModalVisible(false);
  };

  // TODO: This is unimplemented.
  const executeRedeem = (): void => {
    console.info("This is unimplemented.");
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
      <Carousel
        showThumbs={false}
        showStatus={false}
        showIndicators={false}
        renderArrowNext={(onClickHandler, hasNext) => (
          <EuiButtonIcon
            onClick={onClickHandler}
            display="base"
            iconType="arrowRight"
            aria-label="button"
            isDisabled={!hasNext}
            className="arrow"
            style={{ right: 15 }}
          />
        )}
        renderArrowPrev={(onClickHandler, hasPrev) => (
          <EuiButtonIcon
            onClick={onClickHandler}
            display="base"
            iconType="arrowLeft"
            aria-label="button"
            isDisabled={!hasPrev}
            className="arrow"
            style={{ left: 15 }}
          />
        )}
      >
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
            label={`Type the word "${redeemPassword}" to burn your otter for ${redeemerValue} ${redeemerToken}. Warning, this is irreversible.`}
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
