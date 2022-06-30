import { extractSwimPoolError } from "./poolError";

describe("Swim pool errors", () => {
  describe("extractSwimPoolError", () => {
    it("extracts existing pool error", () => {
      const expected = "Pool is temporarily paused. Please try again later.";
      const error =
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 1: custom program error: 0x74";

      expect(extractSwimPoolError(error)).toEqual(expected);
    });

    it("extracts errors from pool error codes within [100, 121] range", () => {
      for (let errorCode = 0x64; errorCode <= 0x79; errorCode++) {
        const error = `custom program error: 0x${errorCode.toString(16)}`;

        expect(extractSwimPoolError(error)).toBeDefined();
      }
    });

    it("doesn't extract unknown pool error", () => {
      const errors = [
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 1: custom program error: 0x65",
      ];

      for (const error in errors) {
        expect(extractSwimPoolError(error)).toBeUndefined();
      }
    });
  });
});
