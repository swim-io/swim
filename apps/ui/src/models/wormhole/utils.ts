import { utils as ethersUtils } from "ethers";

const { zeroPad } = ethersUtils;

export const evmAddressToWormhole = (evmAddress: string): Uint8Array => {
  const hexData = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;
  return zeroPad(Buffer.from(hexData, "hex"), 32);
};
