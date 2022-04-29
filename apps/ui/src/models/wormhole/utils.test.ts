import { evmAddressToWormhole } from "./utils";

describe("models - Wormhole utils", () => {
  describe("evmAddressToWormhole", () => {
    it("handles a 0x-prefixed EVM address", () => {
      const address = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
      const result = evmAddressToWormhole(address);
      expect(result).toStrictEqual(
        Uint8Array.from(
          Buffer.concat([
            Buffer.alloc(12).fill(0),
            Buffer.from("90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "hex"),
          ]),
        ),
      );
    });

    it("handles an EVM address without a 0x prefix", () => {
      const address = "90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
      const result = evmAddressToWormhole(address);
      expect(result).toStrictEqual(
        Uint8Array.from(
          Buffer.concat([
            Buffer.alloc(12).fill(0),
            Buffer.from("90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "hex"),
          ]),
        ),
      );
    });
  });
});
