import BN from "bn.js";

import type { DecimalBN } from "./decimal";
import { decimal } from "./decimal";

describe("Swim decimal", () => {
  it("encodes and decodes a decimal", () => {
    const original: DecimalBN = {
      value: new BN(123456),
      decimals: 18,
    };
    const layout = decimal();
    const buffer = Buffer.alloc(layout.span);
    layout.encode(original, buffer);
    const decoded = layout.decode(buffer);
    expect(decoded.value.eq(original.value)).toBe(true);
    expect(decoded.decimals).toBe(original.decimals);
  });
});
