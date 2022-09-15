import {
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelectable,
  EuiSpacer,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { ReactElement } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import {
  Ecosystem,
  ECOSYSTEM_LIST,
  isEcosystemEnabled,
  TokenConfig,
} from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

import { CustomModal } from "./CustomModal";
import { TokenSearchConfigIcon } from "./TokenIcon";
import { useUserBalanceAmount } from "hooks/crossEcosystem/useUserBalances";

import "./TokenSearchModal.scss";
import { Amount } from "models";

type TokenOption = EuiSelectableOption<{
  readonly data: Readonly<TokenConfig>;
}>;

const renderTokenOption = (option: TokenOption) => {
  return <TokenSearchConfigIcon token={option.data} />;
};

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectToken: (token: TokenConfig) => void;
  readonly handleSelectEcosystem: (ecosystem: Ecosystem) => void;
  readonly tokenOptionIds: readonly string[];
  readonly selectedEcosystem: Ecosystem;
}

const enabledEcosystems = ECOSYSTEM_LIST.filter((ecosystem) =>
  isEcosystemEnabled(ecosystem.id),
);

export const TokenSearchModal = ({
  handleClose,
  handleSelectToken,
  handleSelectEcosystem,
  selectedEcosystem,
  tokenOptionIds,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const tokenBalances: Map<string, Amount | null> = new Map(
    tokens.map((token) => [
      token.id,
      useUserBalanceAmount(token, token.nativeEcosystemId),
    ]),
  );

  const onSelectToken = useCallback((opts: readonly TokenOption[]) => {
    const selected = opts.find(({ checked }) => checked);
    if (selected) {
      handleSelectToken(selected.data);
      handleClose();
    }
  }, []);

  const filteredTokens = tokens.filter(
    (token) =>
      tokenOptionIds.includes(token.id) &&
      token.nativeEcosystemId === selectedEcosystem.id,
  );

  const getBalance = (token: TokenConfig): ReactElement => {
    const balance = tokenBalances.get(token.id);
    return (
      <span>{balance?.toFormattedHumanString(token.nativeEcosystemId)}</span>
    );
  };

  const options = filteredTokens.map((token) => {
    const tokenProject = TOKEN_PROJECTS_BY_ID[token.projectId];
    return {
      label: `${tokenProject.symbol}`,
      searchableLabel: `${tokenProject.symbol} ${tokenProject.displayName}`,
      showIcons: false,
      data: token,
      append: getBalance(token),
    };
  });

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="modal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {t("network_select_modal.title")}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiPanel paddingSize="m" className="networkPanel">
        <EuiFlexGroup responsive={false} wrap gutterSize="s">
          {enabledEcosystems.map((ecosystem) => (
            <EuiFlexItem grow={false} key={ecosystem.id}>
              <EuiButton
                fill={ecosystem.id === selectedEcosystem.id}
                onClick={() => handleSelectEcosystem(ecosystem)}
                iconType={ecosystem.logo}
                size="s"
                minWidth={120}
              >
                {ecosystem.displayName}
              </EuiButton>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="s" />
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {t("token_search_modal.title")}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody className="modalBody">
        <EuiSelectable
          options={options}
          renderOption={renderTokenOption}
          onChange={onSelectToken}
          singleSelection
          listProps={{
            rowHeight: 40,
            windowProps: {
              height: 500,
            },
          }}
        >
          {(list) => <>{list}</>}
        </EuiSelectable>
      </EuiModalBody>
    </CustomModal>
  );
};
