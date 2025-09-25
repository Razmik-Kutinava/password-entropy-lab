# 🚨 Временное решение для тестирования Mini App

## Проблема: GitHub Pages не работает (404 ошибка)

## 🔧 Временное решение через ngrok:

### Шаг 1: Убедитесь, что приложение запущено
```bash
npm run dev
```
Должно показать: `Local: http://localhost:5173/`

### Шаг 2: Запустите ngrok
В **новом терминале**:
```bash
npx ngrok http 5173
```

### Шаг 3: Получите HTTPS URL
1. Ngrok покажет URL вроде: `https://abc123.ngrok.io`
2. Или откройте браузер: http://localhost:4040
3. Скопируйте HTTPS URL

### Шаг 4: Обновите бота
Откройте файл `telegram-bot.cjs` и замените строку:
```javascript
const MINI_APP_URL = 'https://razmik-kutinava.github.io/password-entropy-lab/';
```
на:
```javascript
const MINI_APP_URL = 'https://ваш-ngrok-url.ngrok.io';
```

### Шаг 5: Перезапустите бота
```bash
# Остановите бота (Ctrl+C)
# Затем запустите снова:
node telegram-bot.cjs
```

## 🎯 Тестирование:

1. **Найдите вашего бота** в Telegram
2. **Напишите** `/start`
3. **Нажмите** "🔐 Открыть приложение"
4. **Должно открыться** ваше приложение
5. **Протестируйте** анализ пароля

## 📱 Что должно работать:

- ✅ Ввод пароля и анализ
- ✅ Отображение энтропии и силы
- ✅ Обнаружение проблем
- ✅ Рекомендации по улучшению
- ✅ Экспорт JSON (кнопка в приложении)
- ✅ Экспорт PDF (MainButton в Telegram)

## 🔄 Постоянное решение:

Пока тестируете через ngrok, **включите GitHub Pages**:

1. Перейдите: https://github.com/Razmik-Kutinava/password-entropy-lab
2. **Settings** → **Pages**
3. **Source**: **GitHub Actions**
4. **Save**

После этого приложение будет доступно по:
`https://razmik-kutinava.github.io/password-entropy-lab/`

---

## 🎉 Готово!

Теперь вы можете тестировать Mini App в Telegram!

**Не забудьте вернуть GitHub Pages URL в бота после настройки!**
