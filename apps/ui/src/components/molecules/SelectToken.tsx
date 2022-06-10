import {
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormControlLayout,
  EuiListGroup,
  EuiListGroupItem,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from "@elastic/eui";
import type React from "react";
import { ChangeEvent, Fragment, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../../config";
import { CustomModal } from "../CustomModal";
import { NativeTokenIcon } from "../TokenIcon";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { findOrThrow } from "../../utils";

interface Props {
  readonly token: TokenSpec;
  readonly tokenOptionIds: readonly string[];
  readonly onSelectToken: (tokenId: string) => void;
  readonly disabled: boolean;
}

export const SelectToken: React.FC<Props> = ({
  token,
  tokenOptionIds,
  disabled,
  onSelectToken,
}) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const [isTokenModalVisible, setIsTokenModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const closeModal = () => setIsTokenModalVisible(false);
  const showModal = () => setIsTokenModalVisible(true);
  const clearSearch = () => setSearch("");

  const handleSearchChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setSearch(evt.target.value);

  const handleSelect = (id: string) => {
    onSelectToken(id);
    clearSearch();
    closeModal();
  };

  const options = tokenOptionIds
    .map((tokenId) => findOrThrow(tokens, ({ id }) => id === tokenId))
    .map((tokenSpec) => ({
      id: tokenSpec.id,
      tags: [
        tokenSpec.displayName,
        tokenSpec.symbol,
        tokenSpec.nativeEcosystem,
      ],
      label: <NativeTokenIcon {...tokenSpec} />,
    }));

  const filteredTokens = useMemo(
    () =>
      options.filter((option) =>
        option.tags.find((tag) =>
          tag.toLowerCase().startsWith(search.toLowerCase()),
        ),
      ),
    [search],
  );

  return (
    <Fragment>
      <EuiButton
        fullWidth
        color="text"
        iconSide="right"
        iconType="arrowDown"
        onClick={showModal}
        disabled={disabled}
      >
        <NativeTokenIcon {...token} />
      </EuiButton>
      {isTokenModalVisible && (
        <CustomModal onClose={closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Select Token</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem>
                <EuiFormControlLayout clear={{ onClick: () => clearSearch() }}>
                  <EuiFieldText
                    type="search"
                    value={search}
                    onChange={handleSearchChange}
                    controlOnly
                    placeholder="Search name"
                  />
                </EuiFormControlLayout>
                <EuiSpacer size="l" />
                <EuiListGroup
                  flush={false}
                  bordered={true}
                  gutterSize="m"
                  className="eui-scrollBar"
                  style={{ overflowY: "auto", height: 300 }}
                >
                  {filteredTokens.map((option) => (
                    <EuiListGroupItem
                      isActive={option.id == token.id}
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      label={option.label}
                    />
                  ))}
                </EuiListGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiModalBody>
        </CustomModal>
      )}
    </Fragment>
  );
};
