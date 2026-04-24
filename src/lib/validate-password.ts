export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Минимум 8 символов");
  }
  if (!/[A-ZА-ЯЁ]/.test(password)) {
    errors.push("Минимум 1 заглавная буква");
  }
  if (!/\d/.test(password)) {
    errors.push("Минимум 1 цифра");
  }
  if (!/[!@#$%^&*()_+\-=]/.test(password)) {
    errors.push("Минимум 1 спецсимвол (!@#$%^&*()_+-=)");
  }

  return errors;
}
