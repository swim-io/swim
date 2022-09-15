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
import shallow from "zustand/shallow.js";

import { TokenConfig } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

import { CustomModal } from "./CustomModal";
import { TokenSearchConfigIcon } from "./TokenIcon";

import "./TokenSearchModal.scss";
import { useUserBalanceAmount } from "hooks/crossEcosystem/useUserBalances";

type TokenOption = EuiSelectableOption<{
  readonly data: Readonly<TokenConfig>;
}>;

const renderTokenOption = (option: TokenOption) => {
  return <TokenSearchConfigIcon token={option.data} />;
};

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectToken: (token: TokenConfig) => void;
  readonly tokenOptionIds: readonly string[];
}

export const TokenSearchModal = ({
  handleClose,
  handleSelectToken,
  tokenOptionIds,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const filteredTokens = tokens.filter((token) =>
    tokenOptionIds.includes(token.id),
  );

  const options = filteredTokens.map((token) => {
    const tokenProject = TOKEN_PROJECTS_BY_ID[token.projectId];
    return {
      label: `${tokenProject.symbol}`,
      searchableLabel: `${tokenProject.symbol} ${tokenProject.displayName}`,
      showIcons: false,
      data: token,
      append: (
        <span>
          {useUserBalanceAmount(
            token,
            token.nativeEcosystemId,
          )?.toFormattedHumanString(token.nativeEcosystemId)}
        </span>
      ),
    };
  });

  const onSelectToken = useCallback(
    (opts: readonly TokenOption[]) => {
      const selected = opts.find(({ checked }) => checked);
      if (selected) {
        handleSelectToken(selected.data);
        handleClose();
      }
    },
    [handleSelectToken, handleClose],
  );

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="modal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>{t("token_search_modal.title")}</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody className="modalBody">
        <EuiSelectable
          options={options}
          renderOption={renderTokenOption}
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
