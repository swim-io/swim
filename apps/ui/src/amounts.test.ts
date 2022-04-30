import Decimal from "decimal.js";

import { decimalRemoveTrailingZero } from "./amounts";

describe("amounts", () => {
  describe("decimalRemoveTrailingZero", () => {
    it("should remove trailing zero for decimal", () => {
      expect(decimalRemoveTrailingZero(new Decimal("0.01230000"))).toEqual(
        "0.0123",
      );
    });
    it("should not remove trailing zero for integer", () => {
      expect(decimalRemoveTrailingZero(new Decimal("123000"))).toEqual(
        "123000",
      );
    });
  });
});
