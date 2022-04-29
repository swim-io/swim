import { fixFingerprint } from "./sentry";

describe("errors - Sentry utils", () => {
  describe("fixFingerprint", () => {
    it("handles a 'Transaction simulation failed' message", () => {
      const errorMessage =
        "Transaction simulation failed: Error processing Instruction 2: custom program error: 0x1";
      const result = fixFingerprint(undefined, errorMessage);

      expect(result).toStrictEqual(["custom program error: 0x1"]);
    });

    it("handles a non-string error message", () => {
      const errorMessage = null;
      const result = fixFingerprint(undefined, errorMessage);

      expect(result).toStrictEqual(undefined);
    });
  });
});
