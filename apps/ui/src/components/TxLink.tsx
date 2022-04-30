import type { ReactElement } from "react";

import { EcosystemId } from "../config";
import type { Tx } from "../models";

import { BscTxLink } from "./BscTxLink";
import { EthereumTxLink } from "./EthereumTxLink";
import { SolanaTxLink } from "./SolanaTxLink";

export const TxLink = ({ ecosystem, txId }: Tx): ReactElement => {
  switch (ecosystem) {
    case EcosystemId.Solana:
      return <SolanaTxLink txId={txId} />;
    case EcosystemId.Ethereum:
      return <EthereumTxLink txId={txId} />;
    case EcosystemId.Bsc:
      return <BscTxLink txId={txId} />;
    default:
      return <>txId</>;
  }
};
