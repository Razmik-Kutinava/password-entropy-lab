// /src/core/dict.ts

// Топ-100 самых популярных паролей (расширенная версия)
const TOP_PASSWORDS = new Set([
  // Числовые комбинации
  "123456", "123456789", "12345678", "12345", "1234567", "1234567890", 
  "123123", "111111", "000000", "1111", "1234",
  
  // Английские слова
  "password", "qwerty", "abc123", "admin", "letmein", "welcome", 
  "monkey", "iloveyou", "princess", "dragon", "sunshine", "football", 
  "master", "login", "love", "starwars", "hello", "freedom", "whatever",
  "trustno1", "jordan23", "harley", "robert", "matthew", "jordan", 
  "michelle", "daniel", "andrew", "joshua", "1q2w3e", "zxcvbnm",
  
  // Русские слова (транслит)
  "parol", "parol123", "qwerty123", "admin123", "password123",
  "root", "user", "test", "demo", "guest", "public",
  
  // Популярные комбинации
  "password1", "123qwe", "qwe123", "1q2w3e4r", "asdf1234",
  "qwertyui", "1qaz2wsx", "zaq12wsx", "123321", "654321",
  "7777777", "555555", "123abc", "password!", "p@ssw0rd",
  
  // Простые слова
  "secret", "ninja", "azerty", "123654", "superman", "batman",
  "michael", "jennifer", "computer", "michelle", "jessica",
  "pepper", "1111111", "555555", "666666", "999999", "12345678901",
  
  // Клавиатурные последовательности
  "qwertyuiop", "asdfghjkl", "zxcvbnm123", "1qw23e", "q1w2e3r4",
  "1q2w3e4r5t", "qweasd", "asdfjkl", "qazwsx", "wsxedc"
]);

export function checkTopPasswords(password: string): { word: string; dict: string }[] {
  const lower = password.toLowerCase();
  
  // Прямое совпадение
  if (TOP_PASSWORDS.has(lower)) {
    return [{ word: lower, dict: "top100" }];
  }
  
  // Проверка на базовое слово + цифры в конце
  const baseMatch = lower.match(/^([a-zа-яё]+)\d*$/);
  if (baseMatch && TOP_PASSWORDS.has(baseMatch[1])) {
    return [{ word: baseMatch[1], dict: "top100_variant" }];
  }
  
  // Проверка на цифры + базовое слово
  const prefixMatch = lower.match(/^\d*([a-zа-яё]+)$/);
  if (prefixMatch && TOP_PASSWORDS.has(prefixMatch[1])) {
    return [{ word: prefixMatch[1], dict: "top100_variant" }];
  }
  
  return [];
}
