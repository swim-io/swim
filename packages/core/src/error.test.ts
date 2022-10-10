import { SwimAggregateError, SwimError, isSwimError } from "./error";

describe("isSwimError", () => {
  it("should return true for SwimAggregateError", () => {
    const error = new SwimAggregateError([new Error()], "test", {
      code: "@swim-io/test/test",
    });
    expect(isSwimError(error)).toBe(true);
  });

  it("should return true for SwimError", () => {
    const error = new SwimError("test", {
      code: "@swim-io/test/test",
    });
    expect(isSwimError(error)).toBe(true);
  });

  it("should return false for normal error", () => {
    const error = new Error();
    expect(isSwimError(error)).toBe(false);
  });

  it("should return false for non-error", () => {
    expect(isSwimError("test")).toBe(false);
  });
});
