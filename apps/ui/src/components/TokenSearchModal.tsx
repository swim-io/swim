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

import type { TokenSpec } from "../config";
import { ecosystems } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { findOrThrow } from "../utils";

import { CustomModal } from "./CustomModal";
import { NativeTokenIcon } from "./TokenIcon";

type TokenOption = EuiSelectableOption<{ readonly data: Readonly<TokenSpec> }>;

function renderTokenOption(option: TokenOption) {
  return <NativeTokenIcon {...option.data} />;
}

export interface TokenSearchModalProps {
  readonly handleClose: () => void;
  readonly handleSelectToken: (tokenId: string) => void;
  readonly tokenOptionIds: ReadonlyArray<string>;
}

export const TokenSearchModal = ({
  handleClose,
  handleSelectToken,
  tokenOptionIds,
}: TokenSearchModalProps): ReactElement => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const options = tokenOptionIds
    .map((tokenId) => findOrThrow(tokens, ({ id }) => id === tokenId))
    .map((tokenSpec) => {
      const ecosystem = ecosystems[tokenSpec.nativeEcosystem];
      return {
        label: `${tokenSpec.symbol} on ${ecosystem.displayName}`,
        showIcons: false,
        data: tokenSpec,
      };
    });

  const onSelectToken = useCallback(
    (opts: ReadonlyArray<TokenOption>) => {
      const selected = opts.find(({ checked }) => checked);
      if (selected) {
        handleSelectToken(selected.data.id);
        handleClose();
      }
    },
    [handleSelectToken, handleClose],
  );

  return (
    <CustomModal initialFocus="#token-search" onClose={handleClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Select a Token</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiSelectable
          options={options}
          renderOption={renderTokenOption}
          searchProps={{ id: "token-search" }}
          onChange={onSelectToken}
          searchable
          singleSelection
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
