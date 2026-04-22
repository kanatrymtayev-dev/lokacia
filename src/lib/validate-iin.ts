/**
 * Validation for Kazakhstan IIN (Individual Identification Number)
 * and BIN (Business Identification Number) — both 12 digits.
 */

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate IIN (ИИН) — 12-digit individual identification number.
 * Format: YYMMDD + gender/century digit + 4 digits + checksum
 */
export function validateIIN(iin: string): ValidationResult {
  if (!/^\d{12}$/.test(iin)) {
    return { valid: false, error: "ИИН должен содержать 12 цифр" };
  }

  // First 6 digits = date of birth (YYMMDD)
  const month = parseInt(iin.slice(2, 4), 10);
  const day = parseInt(iin.slice(4, 6), 10);
  if (month < 1 || month > 12) {
    return { valid: false, error: "Неверный месяц рождения в ИИН" };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: "Неверный день рождения в ИИН" };
  }

  // 7th digit = century/gender (1-6)
  const genderDigit = parseInt(iin[6], 10);
  if (genderDigit < 1 || genderDigit > 6) {
    return { valid: false, error: "Неверный код пола/века в ИИН" };
  }

  // Checksum
  if (!checksum12(iin)) {
    return { valid: false, error: "Неверная контрольная сумма ИИН" };
  }

  return { valid: true };
}

/**
 * Validate BIN (БИН) — 12-digit business identification number.
 * Format: YYMM + type digit + registration type + 5 digits + checksum
 */
export function validateBIN(bin: string): ValidationResult {
  if (!/^\d{12}$/.test(bin)) {
    return { valid: false, error: "БИН должен содержать 12 цифр" };
  }

  // First 4 digits = YYMM (year/month of registration)
  const month = parseInt(bin.slice(2, 4), 10);
  if (month < 1 || month > 12) {
    return { valid: false, error: "Неверный месяц регистрации в БИН" };
  }

  // 5th digit = type of entity (4,5,6)
  const typeDigit = parseInt(bin[4], 10);
  if (typeDigit < 4 || typeDigit > 6) {
    return { valid: false, error: "Неверный тип организации в БИН" };
  }

  // Checksum
  if (!checksum12(bin)) {
    return { valid: false, error: "Неверная контрольная сумма БИН" };
  }

  return { valid: true };
}

/**
 * Common checksum algorithm for IIN and BIN.
 * Weights round 1: [1,2,3,4,5,6,7,8,9,10,11]
 * If result is 10, try round 2: [3,4,5,6,7,8,9,10,11,1,2]
 * If still 10 — invalid.
 */
function checksum12(num: string): boolean {
  const digits = num.split("").map(Number);

  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights1[i];
  }
  let check = sum % 11;

  if (check === 10) {
    const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * weights2[i];
    }
    check = sum % 11;
    if (check === 10) return false;
  }

  return check === digits[11];
}

/**
 * Mask IIN/BIN for display: show only middle 4 digits.
 * e.g. "900101350012" → "****0135****"
 */
export function maskIIN(iin: string): string {
  if (iin.length !== 12) return iin;
  return "****" + iin.slice(4, 8) + "****";
}
