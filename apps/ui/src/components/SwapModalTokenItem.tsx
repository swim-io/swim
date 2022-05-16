import { useEuiTheme } from "@elastic/eui";
import type { Dispatch, SetStateAction, FC } from "react";
import styled from "styled-components";

import type { TokenSpec } from "../config";

import { NativeTokenIcon } from "./TokenIcon";

export interface TokenListItemProps {
  readonly tokenId: string;
  readonly setTokenId: Dispatch<SetStateAction<string>>;
  readonly setVisible: Dispatch<SetStateAction<boolean>>;
}

export const SwapModalTokenItem: FC<TokenSpec & TokenListItemProps> = ({
                                                                               setVisible,
                                                                               tokenId,
                                                                               setTokenId,
                                                                               ...props
                                                                             }) => {
  //Hook that enables an HOC, but is(?) a modern hook in later versions of EUI with <EuiProvider/>
  const { euiTheme } = useEuiTheme();

  const HoverDiv = styled.div`
    margin-top: ${euiTheme.size.s};
    margin-bottom: ${euiTheme.size.s};
    padding: ${euiTheme.size.s};
    border-radius: 10px;

    :hover {
      transition: background-color 0.1s;
      //Softer background from buttons on form, but should come from theme because it'll look awful in dark mode
      background-color: rgba(202, 223, 238, 0.66);
    }
  `;

  return (
    <HoverDiv
      onClick={() => {
        setTokenId(props.id);
        setVisible(false);
      }}
      className={"token-list-item"}
    >
      <NativeTokenIcon {...props} />
    </HoverDiv>
  );
};
