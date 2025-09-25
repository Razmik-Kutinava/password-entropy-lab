// Скрипт для исправления Mini App URL
const http = require('http');
const fs = require('fs');

// Функция для получения ngrok URL
function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const httpsUrl = response.tunnels.find(t => t.proto === 'https')?.public_url;
          if (httpsUrl) {
            resolve(httpsUrl);
          } else {
            reject('HTTPS tunnel not found');
          }
        } catch (error) {
          reject('Failed to parse response');
        }
      });
    });
    
    req.on('error', () => reject('Connection failed'));
    req.setTimeout(3000, () => {
      req.destroy();
      reject('Timeout');
    });
  });
}

// Функция для обновления бота
function updateBot(newUrl) {
  try {
    let content = fs.readFileSync('telegram-bot.cjs', 'utf8');
    
    // Заменяем URL
    const oldPattern = /const MINI_APP_URL = ['"`]([^'"`]+)['"`];/;
    const newContent = content.replace(oldPattern, `const MINI_APP_URL = '${newUrl}';`);
    
    if (newContent !== content) {
      fs.writeFileSync('telegram-bot.cjs', newContent);
      console.log('✅ Бот обновлен с новым URL:', newUrl);
      return true;
    } else {
      console.log('⚠️ URL уже актуальный');
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка обновления:', error.message);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🔄 Исправляем Mini App...');
  
  // Попробуем получить ngrok URL
  try {
    const ngrokUrl = await getNgrokUrl();
    console.log('🎉 Найден ngrok URL:', ngrokUrl);
    
    if (updateBot(ngrokUrl)) {
      console.log('\n🚀 Теперь запустите бота:');
      console.log('   node telegram-bot.cjs');
      console.log('\n📱 И протестируйте в Telegram!');
    }
    return;
  } catch (error) {
    console.log('⚠️ Ngrok недоступен:', error);
  }
  
  // Если ngrok недоступен, используем localhost для тестирования
  console.log('\n🔧 Используем localhost для тестирования...');
  
  // Обновляем на localhost (только для тестирования в браузере)
  if (updateBot('http://localhost:5173')) {
    console.log('\n⚠️ ВНИМАНИЕ: Используется localhost URL');
    console.log('📋 Для работы в Telegram нужен HTTPS URL от ngrok');
    console.log('\n🛠️ Запустите ngrok:');
    console.log('   npx ngrok http 5173');
    console.log('   Затем запустите этот скрипт снова');
  }
}

main();
