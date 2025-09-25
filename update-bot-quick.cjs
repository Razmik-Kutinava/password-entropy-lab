// Быстрое обновление URL в боте
const fs = require('fs');

// Получаем URL из аргументов командной строки
const newUrl = process.argv[2];

if (!newUrl) {
  console.log('❌ Использование: node update-bot-quick.js https://your-ngrok-url.ngrok-free.app');
  console.log('📋 Получите URL из http://localhost:4040');
  process.exit(1);
}

try {
  // Читаем файл бота
  let content = fs.readFileSync('telegram-bot.cjs', 'utf8');
  
  // Заменяем URL
  const oldPattern = /const MINI_APP_URL = ['"`]([^'"`]+)['"`];/;
  const newContent = content.replace(oldPattern, `const MINI_APP_URL = '${newUrl}';`);
  
  if (newContent !== content) {
    // Записываем обновленный файл
    fs.writeFileSync('telegram-bot.cjs', newContent);
    console.log('✅ Бот обновлен!');
    console.log('📱 Новый URL:', newUrl);
    console.log('\n🚀 Теперь запустите бота:');
    console.log('   node telegram-bot.cjs');
    console.log('\n📱 И протестируйте в Telegram!');
  } else {
    console.log('⚠️ URL уже актуальный');
  }
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
