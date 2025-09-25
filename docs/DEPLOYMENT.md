# 🚀 Деплой Password & Entropy Lab

## Быстрый старт

```bash
# 1. Сборка проекта
npm run build

# 2. Содержимое папки dist/ готово для деплоя
```

## 🌐 Варианты хостинга

### 1. GitHub Pages (Рекомендуется)

#### Автоматический деплой через GitHub Actions

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

#### Ручной деплой

1. Создайте репозиторий `password-entropy-lab`
2. Соберите проект: `npm run build`
3. Создайте ветку `gh-pages`
4. Загрузите содержимое `dist/` в корень ветки `gh-pages`
5. Включите GitHub Pages в настройках репозитория
6. URL: `https://username.github.io/password-entropy-lab/`

### 2. Vercel

1. Импортируйте проект в [Vercel](https://vercel.com)
2. Настройки сборки (автоматически определятся):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Получите URL: `https://password-entropy-lab.vercel.app/`

### 3. Netlify

#### Через интерфейс
1. Перейдите на [Netlify](https://netlify.com)
2. Перетащите папку `dist/` в область деплоя
3. Получите URL: `https://amazing-name-123456.netlify.app/`

#### Через Git
1. Подключите репозиторий к Netlify
2. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Автоматический деплой при каждом push

### 4. Surge.sh

```bash
npm install -g surge
cd dist
surge --domain password-entropy-lab.surge.sh
```

## 🤖 Настройка Telegram бота

После деплоя настройте бота через @BotFather:

### 1. Menu Button
```
/setmenubutton
[выберите бота]
🔐 Анализ пароля
https://your-deployed-url.com/
```

### 2. Описание
```
/setdescription
[выберите бота]
🔐 Password & Entropy Lab - безопасный анализ паролей по стандарту NIST 800-63B. Все вычисления локальные, полная приватность.
```

### 3. Команды
```
/setcommands
[выберите бота]
start - 🚀 Начать анализ пароля
help - ❓ Справка по использованию
about - ℹ️ О приложении
security - 🔒 Информация о безопасности
```

## 🔧 Настройка домена (опционально)

### Для GitHub Pages
1. Добавьте файл `CNAME` в корень репозитория:
   ```
   passlab.yourdomain.com
   ```
2. Настройте DNS запись CNAME у регистратора домена

### Для Vercel/Netlify
1. В настройках проекта добавьте кастомный домен
2. Настройте DNS записи согласно инструкциям платформы

## 📊 Мониторинг (опционально)

### Google Analytics
Добавьте в `index.html` перед `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**⚠️ Важно:** Настройте GA так, чтобы НЕ отслеживать содержимое полей ввода!

### Простая метрика
Добавьте счетчик посещений без сбора персональных данных:

```javascript
// В App.tsx
onMount(() => {
  // Отправляем только факт посещения, без данных
  fetch('/api/visit', { method: 'POST' }).catch(() => {});
});
```

## 🔄 Обновление приложения

### Автоматические обновления
При использовании GitHub Actions или Vercel/Netlify - обновления происходят автоматически при push в main ветку.

### Ручные обновления
1. Внесите изменения в код
2. `npm run build`
3. Загрузите новую версию `dist/` на хостинг
4. Пользователи получат обновления при следующем открытии

## ✅ Проверка деплоя

### 1. Функциональность
- [ ] Приложение открывается по URL
- [ ] Ввод пароля работает
- [ ] Анализ отображается корректно
- [ ] Экспорт JSON работает
- [ ] Экспорт PDF работает

### 2. Telegram WebApp
- [ ] Menu Button открывает приложение
- [ ] MainButton "📄 Экспорт PDF" работает
- [ ] Приложение адаптировано под мобильный экран
- [ ] Поддержка темной/светлой темы Telegram

### 3. Безопасность
- [ ] DevTools → Network: нет исходящих запросов при вводе пароля
- [ ] HTTPS включен (обязательно для Telegram WebApp)
- [ ] Content-Security-Policy настроен (опционально)

### 4. Производительность
- [ ] Время загрузки < 3 секунд
- [ ] Размер bundle < 500KB (сейчас ~450KB)
- [ ] Работает оффлайн после первой загрузки

## 🚨 Возможные проблемы

### Mixed Content (HTTP/HTTPS)
**Решение:** Используйте только HTTPS хостинг (GitHub Pages, Vercel, Netlify автоматически)

### Telegram WebApp не открывается
**Решения:**
1. Проверьте, что URL доступен по HTTPS
2. Убедитесь, что Menu Button настроен корректно
3. Проверьте консоль браузера на ошибки

### PDF не генерируется
**Решения:**
1. Проверьте поддержку `Blob` в браузере
2. Убедитесь, что `pdf-lib` загружается корректно
3. Проверьте ошибки в консоли

### Медленная загрузка
**Решения:**
1. Включите gzip сжатие на сервере
2. Используйте CDN (Vercel/Netlify включают автоматически)
3. Оптимизируйте bundle через `vite-bundle-analyzer`

## 📱 Тестирование

### Локальное тестирование Telegram WebApp

1. Запустите dev сервер: `npm run dev`
2. Используйте ngrok для HTTPS туннеля:
   ```bash
   npx ngrok http 5173
   ```
3. Настройте Menu Button с ngrok URL
4. Тестируйте в Telegram

### Браузеры для тестирования
- ✅ Chrome/Chromium (основной)
- ✅ Firefox
- ✅ Safari (включая мобильный)
- ✅ Telegram встроенный браузер

## 🎯 Готовые URL для тестирования

После деплоя обновите эти ссылки в README:

- **Демо:** https://your-domain.com/
- **Исходный код:** https://github.com/username/password-entropy-lab
- **Telegram бот:** @your_bot_username

---

**🎉 Поздравляем!** Ваш Password & Entropy Lab готов к использованию!
