// /src/core/patterns.ts

const QWERTY_SEQ = "qwertyuiopasdfghjklzxcvbnm";
const QWERTY_RU_SEQ = "йцукенгшщзхъфывапролджэячсмитьбю";
const NUM_SEQ = "0123456789";
const YEAR_RANGE = Array.from({ length: 36 }, (_, i) => 1990 + i); // 1990–2025

export function detectPatterns(password: string): string[] {
  const lower = password.toLowerCase();
  const issues: string[] = [];

  // Повторы (3 и более одинаковых символов подряд)
  if (/(.)\1{2,}/.test(password)) {
    issues.push("repeat");
  }

  // Последовательности клавиатуры (EN)
  for (let i = 0; i <= lower.length - 4; i++) {
    const substr = lower.substring(i, i + 4);
    if (QWERTY_SEQ.includes(substr) || QWERTY_SEQ.includes(substr.split("").reverse().join(""))) {
      issues.push("keyboard_seq");
      break;
    }
  }

  // Последовательности клавиатуры (RU)
  for (let i = 0; i <= lower.length - 4; i++) {
    const substr = lower.substring(i, i + 4);
    if (QWERTY_RU_SEQ.includes(substr) || QWERTY_RU_SEQ.includes(substr.split("").reverse().join(""))) {
      issues.push("keyboard_seq");
      break;
    }
  }

  // Числовые последовательности (4+ цифры подряд)
  if (/\d{4,}/.test(password)) {
    const nums = password.match(/\d+/g) || [];
    for (const n of nums) {
      if (n.length >= 4 && (NUM_SEQ.includes(n) || NUM_SEQ.includes(n.split("").reverse().join("")))) {
        issues.push("numeric_seq");
        break;
      }
    }
  }

  // Годы (1990-2025)
  for (const year of YEAR_RANGE) {
    if (password.includes(String(year))) {
      issues.push("year");
      break;
    }
  }

  // Простые паттерны
  if (/^(.)\1*$/.test(password)) {
    issues.push("single_char");
  }

  if (/^\d+$/.test(password)) {
    issues.push("only_digits");
  }

  return [...new Set(issues)];
}
