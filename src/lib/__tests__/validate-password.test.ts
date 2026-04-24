import { describe, it, expect } from "vitest";
import { validatePassword } from "../validate-password";

describe("validatePassword", () => {
  it("returns error when password is shorter than 8 characters", () => {
    const errors = validatePassword("Ab1!");
    expect(errors).toContain("Минимум 8 символов");
  });

  it("returns error when password has no uppercase letter", () => {
    const errors = validatePassword("test123!");
    expect(errors).toContain("Минимум 1 заглавная буква");
  });

  it("returns error when password has no digit", () => {
    const errors = validatePassword("Testtest!");
    expect(errors).toContain("Минимум 1 цифра");
  });

  it("returns error when password has no special character", () => {
    const errors = validatePassword("Testtest1");
    expect(errors).toContain("Минимум 1 спецсимвол (!@#$%^&*()_+-=)");
  });

  it("returns empty array for valid password", () => {
    const errors = validatePassword("Test123!");
    expect(errors).toEqual([]);
  });

  it("returns multiple errors for completely weak password", () => {
    const errors = validatePassword("abc");
    expect(errors).toHaveLength(4);
  });

  it("returns errors in Russian", () => {
    const errors = validatePassword("");
    errors.forEach((err) => {
      expect(err).toMatch(/[А-Яа-яЁё]/);
    });
  });
});
