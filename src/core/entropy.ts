// /src/core/entropy.ts

function log2(x: number): number {
  return Math.log(x) / Math.log(2);
}

export function estimateEntropy(
  password: string,
  classes: { lower: boolean; upper: boolean; digits: boolean; special: boolean },
  patterns: string[],
  dictHits: any[]
): number {
  let alphabetSize = 0;
  
  // Подсчет размера алфавита
  if (classes.lower) alphabetSize += 26; // a-z
  if (classes.upper) alphabetSize += 26; // A-Z  
  if (classes.digits) alphabetSize += 10; // 0-9
  if (classes.special) alphabetSize += 33; // спецсимволы

  // Проверка на русские символы
  if (/[а-яё]/i.test(password)) {
    alphabetSize += 33; // русский алфавит
  }

  if (alphabetSize === 0) alphabetSize = 1;

  // Базовая энтропия
  let entropy = password.length * log2(alphabetSize);

  // Применение штрафов за паттерны
  const penalties = {
    repeat: 0.7,           // повторяющиеся символы
    keyboard_seq: 0.6,     // клавиатурные последовательности
    numeric_seq: 0.7,      // числовые последовательности
    year: 0.8,             // годы
    single_char: 0.1,      // один символ
    only_digits: 0.8       // только цифры
  };

  // Применяем штрафы
  for (const pattern of patterns) {
    if (pattern in penalties) {
      entropy *= penalties[pattern as keyof typeof penalties];
    }
  }

  // Штраф за словарные совпадения
  if (dictHits.length > 0) {
    entropy *= 0.5;
  }

  // Бонус за длину (длинные пароли лучше)
  if (password.length >= 16) {
    entropy *= 1.1;
  } else if (password.length >= 20) {
    entropy *= 1.2;
  }

  return Math.max(0, Math.round(entropy * 10) / 10);
}
