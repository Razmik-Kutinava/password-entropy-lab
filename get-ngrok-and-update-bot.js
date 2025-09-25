const http = require('http');
const fs = require('fs');

function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const httpsUrl = tunnels.tunnels.find(t => t.proto === 'https')?.public_url;
          if (httpsUrl) {
            resolve(httpsUrl);
          } else {
            reject('HTTPS tunnel not found');
          }
        } catch (error) {
          reject(`Parse error: ${error.message}`);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(`Request error: ${error.message}`);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject('Timeout');
    });
  });
}

function updateBotUrl(newUrl) {
  try {
    let botCode = fs.readFileSync('telegram-bot.cjs', 'utf8');
    
    // Заменяем URL в боте
    const oldUrlPattern = /const MINI_APP_URL = ['"`]([^'"`]+)['"`];/;
    const newBotCode = botCode.replace(oldUrlPattern, `const MINI_APP_URL = '${newUrl}';`);
    
    if (newBotCode !== botCode) {
      fs.writeFileSync('telegram-bot.cjs', newBotCode);
      console.log('✅ URL в боте обновлен!');
      console.log('🔄 Перезапустите бота: node telegram-bot.cjs');
      return true;
    } else {
      console.log('⚠️ URL в боте не изменился');
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка обновления бота:', error.message);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🔄 Получаем ngrok URL...');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      const url = await getNgrokUrl();
      console.log('\n🎉 NGROK URL получен!');
      console.log('📋 URL:', url);
      
      // Обновляем бота
      if (updateBotUrl(url)) {
        console.log('\n📱 Теперь можно тестировать бота в Telegram!');
        console.log('🔗 URL для Mini App:', url);
      }
      
      process.exit(0);
    } catch (error) {
      attempts++;
      console.log(`Попытка ${attempts}/${maxAttempts}: ${error}`);
      
      if (attempts >= maxAttempts) {
        console.log('\n❌ Не удалось получить ngrok URL');
        console.log('🔧 Убедитесь, что:');
        console.log('  1. ngrok запущен: npx ngrok http 5173');
        console.log('  2. Vite dev сервер работает: npm run dev');
        console.log('  3. Порт 4040 доступен');
        process.exit(1);
      }
      
      // Ждем 2 секунды перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

main();
