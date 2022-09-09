import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ECOSYSTEMS } from "../config";
import type { TokenOption } from "../models";

import { CustomModal } from "./CustomModal";
import { TokenConfigIcon } from "./TokenIcon";

type Option = EuiSelectableOption<{ readonly data: Readonly<TokenOption> }>;

const renderOption = (option: Option) => {
  return (
    <TokenConfigIcon
      token={option.data.tokenConfig}
      ecosystem={option.data.ecosystemId}
    />
  );
};

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectTokenOption: (tokenOption: TokenOption) => void;
  readonly tokenOptions: readonly TokenOption[];
}

export const TokenSearchModalV2 = ({
  handleClose,
  handleSelectTokenOption,
  tokenOptions,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const options = tokenOptions.map((option) => {
    const { tokenConfig, ecosystemId } = option;
    const ecosystem = ECOSYSTEMS[ecosystemId];
    const tokenProject = TOKEN_PROJECTS_BY_ID[tokenConfig.projectId];
    return {
      label: `${tokenProject.symbol} on ${ecosystem.displayName}`,
      searchableLabel: `${tokenProject.symbol} ${tokenProject.displayName} ${ecosystem.displayName}`,
      showIcons: false,
      data: option,
    };
  });

  const onSelectToken = useCallback(
    (opts: readonly Option[]) => {
      const selected = opts.find(({ checked }) => checked);
      if (selected) {
        handleSelectTokenOption(selected.data);
        handleClose();
      }
    },
    [handleSelectTokenOption, handleClose],
  );

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="tokenSearchModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>{t("token_search_modal.title")}</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiSelectable
          options={options}
          renderOption={renderOption}
          searchable
          searchProps={{
            id: "token-search",
            placeholder: t("token_search_modal.search_tokens"),
            isClearable: true,
          }}
          onChange={onSelectToken}
          singleSelection
          listProps={{
            rowHeight: 40,
            windowProps: {
              height: 500,
            },
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
