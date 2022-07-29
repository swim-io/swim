import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../config";
import { ECOSYSTEMS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

import { CustomModal } from "./CustomModal";
import { TokenSpecIcon } from "./TokenIcon";

type TokenOption = EuiSelectableOption<{ readonly data: Readonly<TokenSpec> }>;

const renderTokenOption = (option: TokenOption) => {
  return <TokenSpecIcon token={option.data} />;
};

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectToken: (tokenId: string) => void;
  readonly tokenOptionIds: readonly string[];
}

export const TokenSearchModal = ({
  handleClose,
  handleSelectToken,
  tokenOptionIds,
}: Props): ReactElement => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const options = tokenOptionIds.map((tokenId) => {
    const tokenSpec = findOrThrow(tokens, ({ id }) => id === tokenId);
    const ecosystem = ECOSYSTEMS[tokenSpec.nativeEcosystemId];
    const tokenProject = TOKEN_PROJECTS_BY_ID[tokenSpec.projectId];
    return {
      label: `${tokenProject.symbol} on ${ecosystem.displayName}`,
      searchableLabel: `${tokenProject.symbol} ${tokenProject.displayName} ${ecosystem.displayName}`,
      showIcons: false,
      data: tokenSpec,
    };
  });

  const onSelectToken = useCallback(
    (opts: readonly TokenOption[]) => {
      const selected = opts.find(({ checked }) => checked);
      if (selected) {
        handleSelectToken(selected.data.id);
        handleClose();
      }
    },
    [handleSelectToken, handleClose],
  );

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="tokenSearchModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Select a token</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiSelectable
          options={options}
          renderOption={renderTokenOption}
          searchable
          searchProps={{
            id: "token-search",
            placeholder: "Search tokens",
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
