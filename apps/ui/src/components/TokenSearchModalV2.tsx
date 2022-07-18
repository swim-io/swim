import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import type { ReactElement } from "react";
import { useCallback } from "react";
import shallow from "zustand/shallow.js";

import { ECOSYSTEMS } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import type { TokenOption } from "../models";
import { findOrThrow } from "../utils";

import { CustomModal } from "./CustomModal";
import { TokenOptionIcon } from "./TokenIcon";

type Option = EuiSelectableOption<{ readonly data: Readonly<TokenOption> }>;

const renderOption = (option: Option) => {
  return <TokenOptionIcon tokenOption={option.data} />;
};

export interface TokenSearchModalProps {
  readonly handleClose: () => void;
  readonly handleSelectTokenOption: (tokenOption: TokenOption) => void;
  readonly tokenOptions: readonly TokenOption[];
}

export const TokenSearchModalV2 = ({
  handleClose,
  handleSelectTokenOption,
  tokenOptions,
}: TokenSearchModalProps): ReactElement => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const options = tokenOptions.map((option) => {
    const { tokenId, ecosystemId } = option;
    const tokenSpec = findOrThrow(tokens, ({ id }) => id === tokenId);
    const ecosystem = ECOSYSTEMS[ecosystemId];
    return {
      label: `${tokenSpec.project.symbol} on ${ecosystem.displayName}`,
      searchableLabel: `${tokenSpec.project.symbol} ${tokenSpec.project.displayName} ${ecosystem.displayName}`,
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
