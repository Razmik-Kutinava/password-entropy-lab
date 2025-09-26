const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const logoPath = './src/assets/images/logo.png';
  const publicDir = './public';
  
  // Создаем папку public если её нет
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  try {
    // Размеры иконок для PWA
    const sizes = [
      { size: 192, name: 'pwa-192x192.png' },
      { size: 512, name: 'pwa-512x512.png' },
      { size: 180, name: 'apple-touch-icon.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 16, name: 'favicon-16x16.png' }
    ];
    
    console.log('Генерирую иконки из логотипа...');
    
    for (const { size, name } of sizes) {
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`✓ Создана иконка: ${name} (${size}x${size})`);
    }
    
    // Создаем favicon.ico
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✓ Создан favicon.ico');
    
    console.log('\n🎉 Все иконки успешно созданы в папке public/');
    
  } catch (error) {
    console.error('Ошибка при генерации иконок:', error);
  }
}

generateIcons();
