import type { EuiSelectableOption } from "@elastic/eui";
import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
} from "@elastic/eui";
import { useCallback } from "react";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { WormholeToken } from "../../models";
import { CustomModal } from "../CustomModal";
import { WormholeTokenIcon } from "../TokenIcon";

import "./WormholeTokenModal.scss";

type TokenOption = EuiSelectableOption<{
  readonly data: Readonly<WormholeToken>;
}>;

const renderTokenOption = (option: TokenOption): ReactNode => (
  <WormholeTokenIcon token={option.data} showFullName={true} />
);

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectToken: (token: WormholeToken) => void;
  readonly tokens: readonly WormholeToken[];
}

export const WormholeTokenModal = ({
  handleClose,
  handleSelectToken,
  tokens,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const options = tokens.map((token) => ({
    label: `${token.symbol} ${token.displayName}`,
    searchableLabel: `${token.symbol} ${token.displayName}`,
    showIcons: false,
    data: token,
  }));

  const onSelectToken = useCallback(
    (opts: readonly TokenOption[]) => {
      const selected = opts.find((token: TokenOption) => token.checked);
      if (selected) {
        handleSelectToken(selected.data);
        handleClose();
      }
    },
    [handleClose, handleSelectToken],
  );

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="wormholeModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {t("token_search_modal.search_tokens")}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody className="modalBody">
        <EuiSelectable
          options={options}
          renderOption={renderTokenOption}
          onChange={onSelectToken}
          singleSelection
          searchable
          height="full"
          listProps={{
            rowHeight: 40,
          }}
        >
          {(list, search) => (
            <>
              {search}
              {list}
            </>
          )}
        </EuiSelectable>
      </EuiModalBody>
    </CustomModal>
  );
};
