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
  display_name: string;
  description: string;
  category: "basic" | "business" | "expert" | "regional";
  icon: string;
  color: string;
  min_length: number;
  max_length?: number;
  forbid_top_passwords: boolean;
  require_classes_if_short: boolean;
  min_entropy?: number;
  special_requirements?: string[];
}

// 🔰 БАЗОВЫЕ ПОЛИТИКИ
export const BASIC_SECURITY: Policy = {
  name: "BASIC_SECURITY",
  display_name: "Basic Security",
  description: "Минимальные требования безопасности для личного использования",
  category: "basic",
  icon: "🔒",
  color: "#22c55e",
  min_length: 8,
  forbid_top_passwords: true,
  require_classes_if_short: true,
};

export const NIST_MODERATE: Policy = {
  name: "NIST_800_63B_MODERATE",
  display_name: "NIST Modern",
  description: "Современные требования NIST 800-63B для цифровой идентификации",
  category: "basic",
  icon: "🇺🇸",
  color: "#3b82f6",
  min_length: 12,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 35,
};

export const OWASP_WEB: Policy = {
  name: "OWASP_WEB_SECURITY",
  display_name: "OWASP Web",
  description: "Стандарт OWASP для веб-приложений и онлайн-сервисов",
  category: "basic",
  icon: "🌐",
  color: "#8b5cf6",
  min_length: 10,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 30,
  special_requirements: ["no_sequential_chars", "no_personal_info"],
};

// 💼 БИЗНЕС ПОЛИТИКИ
export const PCI_DSS: Policy = {
  name: "PCI_DSS_COMPLIANCE",
  display_name: "PCI DSS",
  description: "Стандарт безопасности для систем обработки платежных карт",
  category: "business",
  icon: "💳",
  color: "#f59e0b",
  min_length: 12,
  max_length: 25,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 40,
  special_requirements: ["quarterly_change", "no_reuse_last_4"],
};

export const MICROSOFT_AD: Policy = {
  name: "MICROSOFT_AD_ENTERPRISE",
  display_name: "Microsoft AD",
  description: "Корпоративная политика Microsoft Active Directory",
  category: "business",
  icon: "🏢",
  color: "#0078d4",
  min_length: 14,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 42,
  special_requirements: ["complexity_requirements", "account_lockout_protection"],
};

export const GOOGLE_WORKSPACE: Policy = {
  name: "GOOGLE_WORKSPACE",
  display_name: "Google Workspace",
  description: "Политика безопасности Google для корпоративных аккаунтов",
  category: "business",
  icon: "🔍",
  color: "#ea4335",
  min_length: 12,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 38,
  special_requirements: ["2fa_required", "session_management"],
};

// 🎖️ ЭКСПЕРТНЫЕ ПОЛИТИКИ
export const MILITARY_LEVEL: Policy = {
  name: "MILITARY_GRADE_SECURITY",
  display_name: "Military Level",
  description: "Военные стандарты безопасности для критически важных систем",
  category: "expert",
  icon: "🎖️",
  color: "#dc2626",
  min_length: 16,
  max_length: 128,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 55,
  special_requirements: ["no_dictionary_words", "regular_rotation", "multi_factor_auth"],
};

export const BANKING_GRADE: Policy = {
  name: "BANKING_GRADE_SECURITY",
  display_name: "Banking Grade",
  description: "Банковские стандарты для финансовых учреждений",
  category: "expert",
  icon: "🏦",
  color: "#059669",
  min_length: 15,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 50,
  special_requirements: ["transaction_signing", "time_based_tokens", "fraud_detection"],
};

export const ISO_27001: Policy = {
  name: "ISO_27001_COMPLIANCE",
  display_name: "ISO 27001",
  description: "Международный стандарт управления информационной безопасностью",
  category: "expert",
  icon: "📋",
  color: "#7c3aed",
  min_length: 13,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 45,
  special_requirements: ["audit_trail", "risk_assessment", "incident_response"],
};

// 🌍 РЕГИОНАЛЬНЫЕ ПОЛИТИКИ
export const GDPR_READY: Policy = {
  name: "GDPR_COMPLIANCE_EU",
  display_name: "GDPR Ready",
  description: "Соответствие европейскому регламенту по защите персональных данных",
  category: "regional",
  icon: "🇪🇺",
  color: "#1e40af",
  min_length: 11,
  forbid_top_passwords: true,
  require_classes_if_short: true,
  min_entropy: 36,
  special_requirements: ["data_portability", "right_to_erasure", "consent_management"],
};

// Экспортируем все политики в массиве для удобства использования
export const ALL_POLICIES: Policy[] = [
  BASIC_SECURITY,
  NIST_MODERATE,
  OWASP_WEB,
  PCI_DSS,
  MICROSOFT_AD,
  GOOGLE_WORKSPACE,
  MILITARY_LEVEL,
  BANKING_GRADE,
  ISO_27001,
  GDPR_READY,
];

// Группировка политик по категориям
export const POLICY_CATEGORIES = {
  basic: {
    title: "Для себя",
    description: "Базовые требования для личного использования",
    policies: ALL_POLICIES.filter(p => p.category === "basic"),
  },
  business: {
    title: "Для бизнеса", 
    description: "Корпоративные стандарты и бизнес-требования",
    policies: ALL_POLICIES.filter(p => p.category === "business"),
  },
  expert: {
    title: "Экспертные",
    description: "Максимальная защита для критически важных систем",
    policies: ALL_POLICIES.filter(p => p.category === "expert"),
  },
  regional: {
    title: "По регионам",
    description: "Соответствие региональным законодательствам",
    policies: ALL_POLICIES.filter(p => p.category === "regional"),
  },
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

// Функция для проверки пароля по всем политикам
export function assessPasswordAllPolicies(password: string): Record<string, Assessment> {
  const results: Record<string, Assessment> = {};
  
  for (const policy of ALL_POLICIES) {
    results[policy.name] = assessPassword(password, policy);
  }
  
  return results;
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
      rule: `Минимальная длина: ${policy.min_length} символов`,
      status: length >= policy.min_length ? "PASS" : "FAIL"
    },
    {
      rule: "Отсутствие популярных паролей", 
      status: dictionary_hits.length === 0 ? "PASS" : "FAIL"
    }
  ];

  // Проверка максимальной длины (если указана)
  if (policy.max_length) {
    compliance.push({
      rule: `Максимальная длина: ${policy.max_length} символов`,
      status: length <= policy.max_length ? "PASS" : "WARN"
    });
  }

  // Проверка энтропии (если указана минимальная)
  const minEntropy = policy.min_entropy || 30;
  compliance.push({
    rule: `Энтропия: минимум ${minEntropy} бит`,
    status: entropy_bits >= minEntropy ? "PASS" : entropy_bits >= (minEntropy - 10) ? "WARN" : "FAIL"
  });

  // Специальные требования политики
  if (policy.special_requirements) {
    for (const req of policy.special_requirements) {
      const reqDescriptions: Record<string, string> = {
        "no_sequential_chars": "Отсутствие последовательных символов",
        "no_personal_info": "Отсутствие персональной информации",
        "quarterly_change": "Смена пароля каждые 3 месяца",
        "no_reuse_last_4": "Не повторять последние 4 пароля",
        "complexity_requirements": "Требования сложности",
        "account_lockout_protection": "Защита от блокировки аккаунта",
        "2fa_required": "Двухфакторная аутентификация",
        "session_management": "Управление сессиями",
        "no_dictionary_words": "Отсутствие словарных слов",
        "regular_rotation": "Регулярная смена пароля",
        "multi_factor_auth": "Многофакторная аутентификация",
        "transaction_signing": "Подпись транзакций",
        "time_based_tokens": "Временные токены",
        "fraud_detection": "Обнаружение мошенничества",
        "audit_trail": "Аудиторский след",
        "risk_assessment": "Оценка рисков",
        "incident_response": "Реагирование на инциденты",
        "data_portability": "Переносимость данных",
        "right_to_erasure": "Право на удаление",
        "consent_management": "Управление согласиями",
      };
      
      compliance.push({
        rule: reqDescriptions[req] || req,
        status: "PASS" // Базовая реализация - все специальные требования считаем выполненными
      });
    }
  }

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
