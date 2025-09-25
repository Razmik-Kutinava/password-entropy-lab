// Быстрое обновление URL в боте
const fs = require('fs');

const newUrl = process.argv[2];

if (!newUrl) {
  console.log('❌ Использование: node quick-update.cjs https://new-url.ngrok-free.dev');
  process.exit(1);
}

try {
  let content = fs.readFileSync('telegram-bot.cjs', 'utf8');
  const oldPattern = /const MINI_APP_URL = ['"`]([^'"`]+)['"`];/;
  const newContent = content.replace(oldPattern, `const MINI_APP_URL = '${newUrl}';`);
  
  if (newContent !== content) {
    fs.writeFileSync('telegram-bot.cjs', newContent);
    console.log('✅ URL обновлен:', newUrl);
  } else {
    console.log('⚠️ URL уже актуальный');
  }
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
