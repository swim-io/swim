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
import type { QueryObserverResult } from "react-query";
import { Carousel } from "react-responsive-carousel";

import type {
  NftAttribute,
  NftData,
} from "../hooks/solana/useAccountNftsQuery";

import "./NftCarousel.scss";

export interface NftCarouselProps {
  readonly nfts: readonly NftData[];
  readonly refetchNfts: () => Promise<
    QueryObserverResult<readonly NftData[], Error>
  >;
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
    render: (rarityNumber: number) => {
      return "🔥".repeat(rarityNumber);
    },
  },
];

const redeemPassword = "redeem";

export const NftCarousel = ({ nfts }: NftCarouselProps): ReactElement => {
  const [activeNft, setActiveNft] = useState<NftData | null>(null);
  const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const onRedeemInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPasswordInput(e.target.value);
  };
  const { mutateAsync } = useRedeemMutation(activeNft);
  // TODO: Query redeemer to retrieve value of otter (amount and token).
  const redeemerValue = 100;
  const redeemerToken = "USDC";

  const showRedeemModal = (nft: NftData): void => {
    setActiveNft(nft);
    setIsRedeemModalVisible.bind(null, true);
  };
  const hideRedeemModal = (): void => {
    setActiveNft(null);
    setIsRedeemModalVisible(false);
  };

  const executeRedeem = async (): Promise<void> => {
    const tx = await mutateAsync(activeNft);
    tx.
    //     onError: (error) => {
    //       // TODO: throw a pop-up on failure.
    //       console.log("error!", error);
    //     },
    //     onSuccess: () => {
    //       console.log("success");
    //     },
    //   });
    // how do i remove this?
    hideRedeemModal();
  };

  const generateTable = (attributes: readonly NftAttribute[]): ReactElement => (
    <EuiBasicTable<NftAttribute>
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
        // Note, this code block calls setState before it is mounted. This is
        // just a consequence of using this carousel library and EuiButtonIcon,
        // which sets state in constructor.
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
