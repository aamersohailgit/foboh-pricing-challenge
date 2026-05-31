import { describe, expect, it } from "vitest";
import { applyPricing, clampNonNegative, round2HalfUp } from "./pricing";

describe("round2HalfUp", () => {
  it("rounds an exactly-representable half up, not to even", () => {
    expect(round2HalfUp(0.125)).toBe(0.13); // banker's rounding would give 0.12
    expect(round2HalfUp(0.375)).toBe(0.38);
  });

  it("leaves clean 2dp values untouched", () => {
    expect(round2HalfUp(108)).toBe(108);
    expect(round2HalfUp(95)).toBe(95);
    expect(round2HalfUp(279.06)).toBe(279.06);
  });

  it("dodges the classic 1.005*100 binary-float artefact for a real calc", () => {
    // 10% off 215.04 = 193.536 -> 193.54
    expect(round2HalfUp(215.04 * 0.9)).toBe(193.54);
  });
});

describe("clampNonNegative", () => {
  it("clamps negatives to zero and allows zero", () => {
    expect(clampNonNegative(-5)).toBe(0);
    expect(clampNonNegative(0)).toBe(0);
    expect(clampNonNegative(12.5)).toBe(12.5);
  });
});

describe("applyPricing", () => {
  it("dynamic decrease (10% off 120) -> 108", () => {
    expect(applyPricing(120, { kind: "adjustment", type: "dynamic", direction: "decrease", value: 10 })).toBe(108);
  });

  it("fixed decrease ($15 off 120) -> 105", () => {
    expect(applyPricing(120, { kind: "adjustment", type: "fixed", direction: "decrease", value: 15 })).toBe(105);
  });

  it("override returns the flat amount", () => {
    expect(applyPricing(120, { kind: "override", amount: 95 })).toBe(95);
  });

  it("fixed increase adds the delta", () => {
    expect(applyPricing(100, { kind: "adjustment", type: "fixed", direction: "increase", value: 25 })).toBe(125);
  });

  it("never returns a negative price (clamps to 0)", () => {
    expect(applyPricing(10, { kind: "adjustment", type: "fixed", direction: "decrease", value: 15 })).toBe(0);
  });

  it("rounds the final figure to 2 decimal places, once", () => {
    // 10% off 215.04 -> 193.536 -> 193.54
    expect(applyPricing(215.04, { kind: "adjustment", type: "dynamic", direction: "decrease", value: 10 })).toBe(193.54);
  });
});
