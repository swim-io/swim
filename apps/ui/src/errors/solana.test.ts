import type { SolanaError } from "./solana";
import { extractSolanaErrorMessage } from "./solana";

class FakeSolanaError implements SolanaError {
  constructor(
    readonly name: string,
    readonly message: string,
    readonly logs?: readonly string[],
  ) {}
}

describe("Solana error", () => {
  describe("extractSolanaErrorMessage", () => {
    it("improves known errors logs", () => {
      const knownErrorsLogs = [
        "could not be completed within the specified limits",
        "unknown signer:",
        "Error: insufficient funds",
        "custom program error: 0x7b",
        "Program failed to complete: ",
      ];

      for (const log of knownErrorsLogs) {
        const error = new FakeSolanaError("test", "test", [log]);

        const actualError = extractSolanaErrorMessage(error);

        expect(actualError).toBeDefined();
        expect(actualError).not.toEqual(log);
      }
    });

    it("improves known errors messages", () => {
      const knownErrorMessages = ["Blockhash not found", "insufficient funds"];

      for (const message of knownErrorMessages) {
        const error = new FakeSolanaError("test", message);

        expect(extractSolanaErrorMessage(error)).toBeDefined();
        expect(extractSolanaErrorMessage(error)).not.toEqual(message);
      }
    });
  });
});
