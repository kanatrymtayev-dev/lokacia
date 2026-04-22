/**
 * Sanitize chat messages to prevent contact exchange outside the platform.
 * Replaces phone numbers, emails, URLs, and messenger links with [контакт скрыт].
 * Numbers shorter than 7 digits are not filtered (prices, dates, apartment numbers).
 */

const REPLACEMENT = "[контакт скрыт]";

// Phone patterns: +7..., 87..., 8 7..., sequences of 7+ digits with separators
// Must be 7+ digits total to avoid filtering prices/dates
const PHONE_PATTERNS = [
  // +7 xxx xxx xx xx (with optional spaces/dashes)
  /\+?\s*7[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g,
  // 8 7xx xxx xx xx
  /8[\s\-.]?7[\s\-.]?\d{2,3}[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g,
  // Any sequence of 7+ digits (possibly separated by spaces/dashes/dots)
  /\b\d[\d\s\-.\(\)]{8,}\d\b/g,
];

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// URL patterns
const URL_PATTERNS = [
  /https?:\/\/[^\s<>]+/gi,
  /www\.[^\s<>]+/gi,
];

// Messenger patterns (case-insensitive)
const MESSENGER_PATTERNS = [
  /wa\.me\/[^\s<>]*/gi,
  /t\.me\/[^\s<>]*/gi,
  /\bwhatsapp\b/gi,
  /\btelegram\b/gi,
  /\bviber\b/gi,
  /\binstagram\b/gi,
];

/**
 * Check if a matched "phone" string actually contains 7+ real digits.
 * This prevents filtering short numbers like prices (50000) or dates.
 */
function hasEnoughDigits(match: string, min = 7): boolean {
  const digits = match.replace(/\D/g, "");
  return digits.length >= min;
}

export interface SanitizeResult {
  text: string;
  blocked: boolean;
}

export function sanitizeMessage(text: string): SanitizeResult {
  let result = text;
  let blocked = false;

  // Emails first (before URL check catches the domain part)
  result = result.replace(EMAIL_PATTERN, () => {
    blocked = true;
    return REPLACEMENT;
  });

  // URLs
  for (const pattern of URL_PATTERNS) {
    result = result.replace(pattern, () => {
      blocked = true;
      return REPLACEMENT;
    });
  }

  // Messenger keywords
  for (const pattern of MESSENGER_PATTERNS) {
    result = result.replace(pattern, () => {
      blocked = true;
      return REPLACEMENT;
    });
  }

  // Phones — only if 7+ digits
  for (const pattern of PHONE_PATTERNS) {
    result = result.replace(pattern, (match) => {
      if (hasEnoughDigits(match)) {
        blocked = true;
        return REPLACEMENT;
      }
      return match;
    });
  }

  return { text: result, blocked };
}
