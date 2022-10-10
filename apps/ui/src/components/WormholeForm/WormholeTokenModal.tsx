import {
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
  EuiSpacer,
  EuiToken,
} from "@elastic/eui";
import type { EuiSelectableOption } from "@elastic/eui";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { useCallback } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import shallow from "zustand/shallow.js";

import type { EcosystemId, TokenConfig } from "../../config";
import { ECOSYSTEM_LIST, isEcosystemEnabled } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useUserBalanceAmount } from "../../hooks";

import { CustomModal } from "../CustomModal";
import { TokenSearchConfigIcon } from "../TokenIcon";

import "./WormholeTokenModal.scss";

type TokenOption = EuiSelectableOption<{
  readonly data: Readonly<TokenConfig>;
}>;

const renderTokenOption = (option: TokenOption) => {
  return <TokenSearchConfigIcon token={option.data} />;
};

interface Props {
  readonly handleClose: () => void;
  readonly handleSelectToken: (token: TokenConfig) => void;
  readonly handleSelectEcosystem: (ecosystemId: EcosystemId) => void;
  readonly tokenOptionIds: readonly string[];
  readonly selectedEcosystemId: EcosystemId;
  readonly tokenAddress: string;
  readonly handleTokenAddress: (tokenAddress: string) => void;
}

interface TokenProps {
  readonly token: TokenConfig;
}

const TokenBalance = ({ token }: TokenProps): ReactElement => {
  const balance = useUserBalanceAmount(token, token.nativeEcosystemId);
  return (
    <span>{balance?.toFormattedHumanString(token.nativeEcosystemId)}</span>
  );
};

const enabledEcosystems = ECOSYSTEM_LIST.filter((ecosystem) =>
  isEcosystemEnabled(ecosystem.id),
);

export const WormholeTokenModal = ({
  handleClose,
  handleSelectToken,
  handleSelectEcosystem,
  handleTokenAddress,
  selectedEcosystemId,
  tokenOptionIds,
  tokenAddress,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { tokens } = useEnvironment(selectConfig, shallow);

  const onSelectToken = useCallback(
    (opts: readonly TokenOption[]) => {
      const selected = opts.find(({ checked }) => checked);
      if (selected) {
        handleSelectToken(selected.data);
        handleClose();
      }
    },
    [handleClose, handleSelectToken],
  );

  const onSaveTokenAddress = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const filteredTokens = tokens.filter(
    (token) =>
      tokenOptionIds.includes(token.id) &&
      token.nativeEcosystemId === selectedEcosystemId,
  );

  const options = filteredTokens.map((token) => {
    const tokenProject = TOKEN_PROJECTS_BY_ID[token.projectId];
    return {
      label: `${tokenProject.symbol}`,
      searchableLabel: `${tokenProject.symbol} ${tokenProject.displayName}`,
      showIcons: false,
      data: token,
      append: <TokenBalance token={token} />,
    };
  });

  return (
    <CustomModal
      initialFocus="#token-search"
      onClose={handleClose}
      className="wormholeModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {t("token_select_modal.title")}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiFlexGroup
        responsive={false}
        wrap
        gutterSize="xs"
        className="networkPanel"
      >
        {enabledEcosystems.map((ecosystem) => (
          <EuiFlexItem grow={false} key={ecosystem.id}>
            <EuiButton
              fill={ecosystem.id === selectedEcosystemId}
              onClick={() => handleSelectEcosystem(ecosystem.id)}
              iconType={ecosystem.logo}
              size="s"
              minWidth={125}
            >
              {ecosystem.displayName}
            </EuiButton>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      <EuiHorizontalRule margin="s" />

      <EuiModalBody className="modalBody">
        <EuiFieldText
          placeholder={t("wormhole_page.custom_token_address")}
          value={tokenAddress}
          onChange={({ target: { value } }) => handleTokenAddress(value)}
          prepend={<EuiIcon type="tokenAlias" />}
          append={
            <EuiIcon
              type="save"
              className="saveToken"
              onClick={tokenAddress ? onSaveTokenAddress : undefined}
            />
          }
          fullWidth
        />

        <EuiSpacer size="m" />

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
