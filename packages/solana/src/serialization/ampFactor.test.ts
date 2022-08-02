import BN from "bn.js";

import type { AmpFactor } from "./ampFactor";
import { ampFactor } from "./ampFactor";

describe("Swim amp factor", () => {
  it("encodes and decodes an amp factor", () => {
    const original: AmpFactor = {
      initialValue: {
        value: new BN(123456),
        decimals: 18,
      },
      initialTs: new BN(1635248668746),
      targetValue: {
        value: new BN(234567),
        decimals: 9,
      },
      targetTs: new BN(3270497401746),
    };
    const layout = ampFactor();
    const buffer = Buffer.alloc(layout.span);
    layout.encode(original, buffer);
    const decoded = layout.decode(buffer);
    expect(decoded.initialValue.value.eq(original.initialValue.value)).toBe(
      true,
    );
    expect(decoded.initialValue.decimals).toBe(original.initialValue.decimals);
    expect(decoded.initialTs.eq(original.initialTs)).toBe(true);
    expect(decoded.targetValue.value.eq(original.targetValue.value)).toBe(true);
    expect(decoded.targetValue.decimals).toBe(original.targetValue.decimals);
    expect(decoded.targetTs.eq(original.targetTs)).toBe(true);
  });
});
