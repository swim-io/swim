import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_TO_NAME } from "@certusone/wormhole-sdk";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiSuperSelect,
  EuiText,
} from "@elastic/eui";

import type { WormholeEcosystemId } from "../../config";
import { WORMHOLE_ECOSYSTEMS } from "../../config";

import "./WormholeForm.scss";

interface Props {
  readonly chains: readonly ChainId[];
  readonly selectedChainId: ChainId;
  readonly onSelectChain: (chain: ChainId) => void;
  readonly label?: string;
}

const WormholeChainSelect = ({
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
            type={
              WORMHOLE_ECOSYSTEMS[
                CHAIN_ID_TO_NAME[chainId] as WormholeEcosystemId
              ].logo
            }
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s" className="chainName">
            {
              WORMHOLE_ECOSYSTEMS[
                CHAIN_ID_TO_NAME[chainId] as WormholeEcosystemId
              ].displayName
            }
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    append: (
      <EuiIcon
        type={
          WORMHOLE_ECOSYSTEMS[CHAIN_ID_TO_NAME[chainId] as WormholeEcosystemId]
            .logo
        }
      />
    ),
    selected: chainId === selectedChainId,
  }));

  return (
    <>
      <EuiFormRow label={label}>
        <EuiSuperSelect
          options={chainOptions}
          valueOfSelected={String(selectedChainId)}
          onChange={(value) => onSelectChain(Number(value) as ChainId)}
          className="euiButton--primary"
          itemClassName="chainSelectItem"
          hasDividers
        />
      </EuiFormRow>
    </>
  );
};

export default WormholeChainSelect;
