import { describe, it, expect } from "vitest";
import { formatPrice, formatRating, pluralize } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats integer price with tenge symbol", () => {
    expect(formatPrice(5000)).toContain("5");
    expect(formatPrice(5000)).toContain("₸");
  });

  it("formats large numbers with separators", () => {
    const result = formatPrice(1500000);
    expect(result).toContain("₸");
    // Should contain the number in some locale format
    expect(result.replace(/\s/g, "")).toContain("1500000");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("0 ₸");
  });
});

describe("formatRating", () => {
  it("formats to one decimal place", () => {
    expect(formatRating(4.567)).toBe("4.6");
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(3.14)).toBe("3.1");
  });

  it("handles zero", () => {
    expect(formatRating(0)).toBe("0.0");
  });
});

describe("pluralize", () => {
  it("uses singular for 1", () => {
    expect(pluralize(1, "отзыв", "отзыва", "отзывов")).toBe("1 отзыв");
    expect(pluralize(21, "отзыв", "отзыва", "отзывов")).toBe("21 отзыв");
  });

  it("uses few for 2-4", () => {
    expect(pluralize(2, "отзыв", "отзыва", "отзывов")).toBe("2 отзыва");
    expect(pluralize(3, "отзыв", "отзыва", "отзывов")).toBe("3 отзыва");
    expect(pluralize(4, "отзыв", "отзыва", "отзывов")).toBe("4 отзыва");
    expect(pluralize(22, "отзыв", "отзыва", "отзывов")).toBe("22 отзыва");
  });

  it("uses many for 5-20 and 0", () => {
    expect(pluralize(0, "отзыв", "отзыва", "отзывов")).toBe("0 отзывов");
    expect(pluralize(5, "отзыв", "отзыва", "отзывов")).toBe("5 отзывов");
    expect(pluralize(11, "отзыв", "отзыва", "отзывов")).toBe("11 отзывов");
    expect(pluralize(12, "отзыв", "отзыва", "отзывов")).toBe("12 отзывов");
    expect(pluralize(14, "отзыв", "отзыва", "отзывов")).toBe("14 отзывов");
    expect(pluralize(100, "отзыв", "отзыва", "отзывов")).toBe("100 отзывов");
  });
});
