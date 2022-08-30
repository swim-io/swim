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
import { useTranslation } from "react-i18next";
import { Carousel } from "react-responsive-carousel";

import { useNotification } from "../../core/store";
import { useRedeemMutation } from "../../hooks";
import type {
  NftAttribute,
  NftData,
} from "../../hooks/solana/useAccountNftsQuery";

import "./NftCarousel.scss";

interface Props {
  readonly nfts: readonly NftData[];
}

const redeemPassword = "redeem";
const redemptionAmount = "3000 xSWIM";

export const NftCarousel = ({ nfts }: Props): ReactElement => {
  const { t } = useTranslation();
  const [activeNft, setActiveNft] = useState<NftData | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const { notify } = useNotification();
  const { mutateAsync, isLoading } = useRedeemMutation(activeNft);
  const isRedeemModalVisible = activeNft !== null;
  const onRedeemInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPasswordInput(e.target.value);
  };
  const showRedeemModal = (nft: NftData): void => {
    setActiveNft(nft);
  };
  const hideRedeemModal = (): void => {
    setActiveNft(null);
  };

  const executeRedeem = async (): Promise<void> => {
    try {
      await mutateAsync(activeNft);
      notify(
        t("notify.redeem_success_title"),
        t("notify.redeem_success_description", { redemptionAmount }),
        "success",
      );
      hideRedeemModal();
    } catch (error) {
      notify("Error", String(error), "error");
    }
  };

  const rarityColumns = [
    {
      field: "traitType",
      name: t("redeem_page.nft_trait_type"),
    },
    {
      field: "value",
      name: t("redeem_page.nft_trait"),
    },
    {
      field: "rarity",
      name: t("redeem_page.nft_rarity"),
      render: (rarityNumber: number) => {
        return "🔥".repeat(rarityNumber);
      },
    },
  ];

  const generateTable = (attributes: readonly NftAttribute[]): ReactElement => (
    <EuiBasicTable<NftAttribute>
      tableCaption={t("redeem_page.nft_nft_traits_title")}
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
                  <EuiButton
                    onClick={() => {
                      showRedeemModal(nft);
                    }}
                  >
                    {t("redeem_page.redeem_button")}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          );
        })}
      </Carousel>
      {isRedeemModalVisible && (
        <EuiConfirmModal
          title={t("redeem_page.redeem_modal_title")}
          onCancel={hideRedeemModal}
          onConfirm={() => {
            executeRedeem().catch(console.error);
          }}
          confirmButtonText={t("redeem_page.redeem_button")}
          cancelButtonText={t("general.cancel_button")}
          buttonColor="danger"
          confirmButtonDisabled={passwordInput.toLowerCase() !== redeemPassword}
          isLoading={isLoading}
        >
          <EuiFormRow
            label={t("redeem_page.warning_for_burn_otter", {
              redeemPassword,
              redemptionAmount,
            })}
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
