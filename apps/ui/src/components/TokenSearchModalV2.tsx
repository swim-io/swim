import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import { findOrThrow } from "@swim-io/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import shallow from "zustand/shallow.js";

import { ECOSYSTEMS, PROJECTS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import type { TokenOption } from "../models";

import { CustomModal } from "./CustomModal";
import { TokenOptionIcon } from "./TokenIcon";

type Option = EuiSelectableOption<{ readonly data: Readonly<TokenOption> }>;

const renderOption = (option: Option) => {
  return <TokenOptionIcon tokenOption={option.data} />;
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
  const { tokens } = useEnvironment(selectConfig, shallow);
  const options = tokenOptions.map((option) => {
    const { tokenId, ecosystemId } = option;
    const tokenSpec = findOrThrow(tokens, ({ id }) => id === tokenId);
    const ecosystem = ECOSYSTEMS[ecosystemId];
    const tokenProject = PROJECTS[tokenSpec.projectId];
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
          <h1>Select a token</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiSelectable
          options={options}
          renderOption={renderOption}
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
