// /src/core/assessPassword.ts
import { detectPatterns } from "./patterns";
import { checkTopPasswords } from "./dict";
import { estimateEntropy } from "./entropy";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface Assessment {
  password_sample: string;
  length: number;
  classes: {
    lower: boolean;
    upper: boolean;
    digits: boolean;
    special: boolean;
  };
  entropy_bits: number;
  strength: StrengthLevel;
  patterns: string[];
  dictionary_hits: { word: string; dict: string }[];
  compliance: { rule: string; status: "PASS" | "WARN" | "FAIL" }[];
  fix_suggestions: string[];
  policy_name: string;
  timestamp: string;
}

export interface Policy {
  name: string;
  min_length: number;
  forbid_top_passwords: boolean;
  require_classes_if_short: boolean; // если длина < 16 — требовать спецсимволы
}

export const NIST_MODERATE: Policy = {
  name: "NIST_800_63B_MODERATE",
  min_length: 12,
  forbid_top_passwords: true,
  require_classes_if_short: true,
};

function getStrengthLevel(entropy: number, length: number): StrengthLevel {
  // Определение уровня силы пароля на основе энтропии и длины
  if (entropy >= 60 && length >= 16) return 4; // Очень сильный
  if (entropy >= 45 && length >= 12) return 3; // Сильный  
  if (entropy >= 30 && length >= 8) return 2;  // Средний
  if (entropy >= 20 && length >= 6) return 1;  // Слабый
  return 0; // Очень слабый
}

function generateFixSuggestions(
  password: string,
  patterns: string[],
  dictHits: { word: string; dict: string }[],
  classes: any,
  policy: Policy
): string[] {
  const suggestions: string[] = [];

  // Проблемы с длиной
  if (password.length < policy.min_length) {
    suggestions.push(`Увеличьте длину до минимум ${policy.min_length} символов`);
  }

  // Словарные совпадения
  if (dictHits.length > 0) {
    suggestions.push("Не используйте популярные пароли из словарей");
  }

  // Специфичные паттерны
  const patternSuggestions: Record<string, string> = {
    repeat: "Избегайте повторяющихся символов (aaa, 111)",
    keyboard_seq: "Не используйте клавиатурные последовательности (qwerty, йцукен)",
    numeric_seq: "Избегайте числовых последовательностей (123456, 987654)",
    year: "Не включайте годы (1990-2025) в пароль",
    single_char: "Используйте разные символы",
    only_digits: "Добавьте буквы и спецсимволы, не только цифры"
  };

  for (const pattern of patterns) {
    if (pattern in patternSuggestions) {
      suggestions.push(patternSuggestions[pattern]);
    }
  }

  // Рекомендации по классам символов
  if (password.length < 16 && policy.require_classes_if_short) {
    if (!classes.lower) suggestions.push("Добавьте строчные буквы");
    if (!classes.upper) suggestions.push("Добавьте заглавные буквы");
    if (!classes.digits) suggestions.push("Добавьте цифры");
    if (!classes.special) suggestions.push("Добавьте спецсимволы (!@#$%^&*)");
  }

  // Общие рекомендации
  if (suggestions.length === 0 && password.length < 16) {
    suggestions.push("Рассмотрите увеличение длины до 16+ символов для лучшей безопасности");
  }

  return suggestions;
}

export function assessPassword(password: string, policy: Policy = NIST_MODERATE): Assessment {
  // Маскированная версия для отображения
  const masked = "•".repeat(Math.min(password.length, 50));
  const length = password.length;

  // Определение классов символов
  const classes = {
    lower: /[a-zа-яё]/.test(password),
    upper: /[A-ZА-ЯЁ]/.test(password),
    digits: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  // Анализ паттернов
  const patterns = detectPatterns(password);
  
  // Проверка словарей
  const dictionary_hits = checkTopPasswords(password);
  
  // Расчет энтропии
  const entropy_bits = estimateEntropy(password, classes, patterns, dictionary_hits);
  
  // Определение уровня силы
  const strength = getStrengthLevel(entropy_bits, length);

  // Проверка соответствия политике
  const compliance: { rule: string; status: "PASS" | "WARN" | "FAIL" }[] = [
    {
      rule: `min_length>=${policy.min_length}`,
      status: length >= policy.min_length ? "PASS" : "FAIL"
    },
    {
      rule: "deny_common_passwords", 
      status: dictionary_hits.length === 0 ? "PASS" : "FAIL"
    },
    {
      rule: "entropy_check",
      status: entropy_bits >= 30 ? "PASS" : entropy_bits >= 20 ? "WARN" : "FAIL"
    }
  ];

  // Дополнительная проверка на классы символов для коротких паролей
  if (length < 16 && policy.require_classes_if_short) {
    const classCount = Object.values(classes).filter(Boolean).length;
    compliance.push({
      rule: "character_classes>=3",
      status: classCount >= 3 ? "PASS" : "WARN"
    });
  }

  // Генерация рекомендаций
  const fix_suggestions = generateFixSuggestions(password, patterns, dictionary_hits, classes, policy);

  return {
    password_sample: masked,
    length,
    classes,
    entropy_bits,
    strength,
    patterns,
    dictionary_hits,
    compliance,
    fix_suggestions,
    policy_name: policy.name,
    timestamp: new Date().toISOString(),
  };
}
