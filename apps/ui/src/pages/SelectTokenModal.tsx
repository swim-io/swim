import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
  EuiSuperSelect,
  EuiText,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { CustomModal } from "../components/CustomModal";
import { ecosystems } from "../config";

export type TokenOption = {
  readonly value: string;
  readonly inputDisplay: ReactElement;
};
export interface SelectTokenProps {
  readonly tokenOptions: readonly TokenOption[];
  readonly closeModal: () => void;
  readonly setSelectedToken: (value: string) => void;
}

type SelectableOption = {
  readonly checked?: "on" | "off";
  readonly label: string;
  readonly searchableLabel: string;
  readonly data: {
    readonly tokenOption: TokenOption;
  };
};

export const SelectTokenModal = ({
  tokenOptions,
  closeModal,
  setSelectedToken,
}: SelectTokenProps): ReactElement => {
  // eslint-disable-next-line functional/prefer-readonly-type
  const allSelectableTokenOptions: SelectableOption[] = tokenOptions.map(
    (tokenOption) => {
      return {
        label: `${tokenOption.value}`,
        searchableLabel: `${tokenOption.value}`,
        data: {
          tokenOption: tokenOption,
        },
      };
    },
  );

  const renderToken = (option: SelectableOption) => {
    return option.data.tokenOption.inputDisplay;
  };

  const ecosystemOptions = (() => {
    const options = Object.entries(ecosystems).map(
      ([ecosystemId, ecosystem]) => {
        return {
          value: ecosystemId,
          inputDisplay: ecosystem.displayName,
        };
      },
    );
    return [{ value: "all", inputDisplay: "All" }, ...options];
  })();

  const [ecosystemOption, setEcocsystemOption] = useState(
    ecosystemOptions[0].value,
  );

  const [selectableTokenOptions, setSelectableTokenOptions] = useState(
    allSelectableTokenOptions,
  );

  const selectOption = (newOptions: SelectableOption[]) => {
    const selectedToken = newOptions.find(
      (option) => option.checked === "on",
    );
    if (selectedToken) {
      setSelectedToken(selectedToken.data.tokenOption.value);
      closeModal();
    }
  }

  useEffect(() => {
    if (ecosystemOption === "all") {
      setSelectableTokenOptions(allSelectableTokenOptions);
    } else {
      const filteredTokenOptions = allSelectableTokenOptions.filter(
        (option) => {
          return option.searchableLabel.includes(ecosystemOption);
        },
      );
      setSelectableTokenOptions(filteredTokenOptions);
    }
  }, [ecosystemOption, allSelectableTokenOptions]);

  return (
    <CustomModal onClose={closeModal}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h2>Select Token</h2>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFlexGroup gutterSize="s" direction="column">
          <EuiFlexItem>
            <EuiFlexGroup gutterSize="xs" alignItems="center" direction="row">
              <EuiFlexItem grow={1}>
                <EuiText textAlign="left">Ecosystem:</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={4}>
                <EuiSuperSelect
                  name="ecosystems filter"
                  options={ecosystemOptions}
                  valueOfSelected={ecosystemOption}
                  onChange={setEcocsystemOption}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiSelectable
              searchable
              options={selectableTokenOptions}
              singleSelection="always"
              onChange={selectOption}
              renderOption={renderToken}
            >
              {(list, search) => (
                <>
                  {search}
                  {list}
                </>
              )}
            </EuiSelectable>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>
    </CustomModal>
  );
};
