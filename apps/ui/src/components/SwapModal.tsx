import {
  EuiButton,
  EuiFieldText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  transparentize,
  useEuiTheme
} from "@elastic/eui";
import { HTMLAttributes } from "react";
import { useState } from "react";

import type { TokenSpec } from "../config";
import { ecosystems } from "../config";

import { SwapModalTokenItem } from "./SwapModalTokenItem";

export interface CoinSelectModalProps extends HTMLAttributes<HTMLDivElement> {
  readonly visible: boolean;
  readonly setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  readonly tokenId: string;
  readonly setTokenId: React.Dispatch<React.SetStateAction<string>>;
  readonly poolTokens: readonly TokenSpec[];
}

export const SwapModal: React.FC<CoinSelectModalProps> = (
  { visible, setVisible, tokenId, setTokenId, poolTokens },
  props
) => {
  //Hook that enables an HOC, but is(?) a modern hook in later versions of EUI with <EuiProvider/>
  const { euiTheme } = useEuiTheme();

  const [filter, setFilter] = useState(""); //Should init empty so all options appear when the user opens the modal
  const handleClose = () => {
    setVisible(false);
    setFilter("");
  };
  const tokenOptions = poolTokens
    .filter((e) => {
      const lowerFilter = filter.toLowerCase();

      return (
        //Would usually use a fuzzy matcher here but time
        e.symbol.toLowerCase().includes(lowerFilter) ||
        ecosystems[e.nativeEcosystem].displayName
          .toLowerCase()
          .includes(lowerFilter)
        // Below is commented because it was confusing typing "eth" and then seeing USD tETHer appear
        // e.displayName.toLowerCase().includes(lowerFilter)
      );
    })
    .map((e) => (
      <SwapModalTokenItem
        {...e}
        tokenId={tokenId}
        setTokenId={setTokenId}
        setVisible={setVisible}
        key={`${e.symbol}+${e.nativeEcosystem}`}
      />
    ));

  return visible ? (
    <EuiModal {...props} onClose={handleClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Select a token</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiFieldText
          className={"token-select-modal-filter-input"}
          value={filter}
          placeholder={"Search availabe tokens"}
          onChange={(e) => setFilter(e.target.value)}
        />
      </EuiModalBody>
      {/*//Use a div because xxs isn't available as a size prop in EuiSpacer*/}
      <div
        style={{
          height: euiTheme.size.xxs,
          backgroundColor: transparentize(euiTheme.colors.primary, 0.4)
        }}
      />
      <EuiModalBody className={"eui-scrollBar"} style={{ overflow: "auto" }}>
        {tokenOptions}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={handleClose} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  ) : (
    <div />
  );
};
