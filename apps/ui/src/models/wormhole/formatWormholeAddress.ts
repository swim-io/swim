import { PublicKey } from "@solana/web3.js";
import { evmAddressToWormhole } from "@swim-io/evm";

import { Protocol } from "../../config";

export const formatWormholeAddress = (
  protocol: Protocol,
  address: string,
): Uint8Array => {
  switch (protocol) {
    case Protocol.Solana:
      return new PublicKey(address).toBytes();
    case Protocol.Evm:
      return evmAddressToWormhole(address);
    default:
      throw new Error("Protocol not supported");
  }
};
