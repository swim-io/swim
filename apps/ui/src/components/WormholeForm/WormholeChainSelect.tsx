import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiSuperSelect,
  EuiText,
} from "@elastic/eui";

import type { SupportedChainId } from "../../config";
import { WORMHOLE_ECOSYSTEMS } from "../../config";

import "./WormholeForm.scss";

interface Props {
  readonly chains: readonly SupportedChainId[];
  readonly selectedChainId: SupportedChainId;
  readonly onSelectChain: (chain: SupportedChainId) => void;
  readonly label?: string;
}

export const WormholeChainSelect = ({
  chains,
  selectedChainId,
  onSelectChain,
  label,
}: Props) => {
  const chainOptions = chains.map((chainId) => ({
    value: String(chainId),
    inputDisplay: (
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={WORMHOLE_ECOSYSTEMS[chainId].logo || "questionInCircle"}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s" className="chainName">
            {WORMHOLE_ECOSYSTEMS[chainId].displayName}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    append: (
      <EuiIcon type={WORMHOLE_ECOSYSTEMS[chainId].logo || "questionInCircle"} />
    ),
    selected: chainId === selectedChainId,
  }));

  return (
    <>
      <EuiFormRow label={label}>
        <EuiSuperSelect
          options={chainOptions}
          valueOfSelected={selectedChainId.toString()}
          onChange={(value) =>
            onSelectChain(parseInt(value, 10) as SupportedChainId)
          }
          className="euiButton--primary"
          itemClassName="chainSelectItem"
          hasDividers
        />
      </EuiFormRow>
    </>
  );
};
