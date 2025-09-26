// /src/utils/exportPDF.ts
import type { Assessment } from "../core/assessPassword";

const STRENGTH_LABELS = [
  "Очень слабый", 
  "Слабый", 
  "Средний", 
  "Сильный", 
  "Очень сильный"
];

const PATTERN_LABELS: Record<string, string> = {
  repeat: "Повторяющиеся символы",
  keyboard_seq: "Клавиатурная последовательность", 
  numeric_seq: "Числовая последовательность",
  year: "Содержит год",
  single_char: "Один символ",
  only_digits: "Только цифры"
};

// Альтернативный экспорт через HTML
export async function exportPDFAlternative(assessment: Assessment): Promise<void> {
  try {
    // Создаем HTML содержимое для PDF
    const htmlContent = generatePDFHTML(assessment);
    
    // Создаем временный элемент
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Ждем загрузки и печатаем
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    console.log("PDF альтернативный экспорт запущен");
  } catch (error) {
    console.error("Ошибка альтернативного PDF:", error);
    // Fallback - скачиваем как текст
    exportAsText(assessment);
  }
}

// Основной экспорт PDF через pdf-lib
export async function exportPDF(assessment: Assessment): Promise<void> {
  try {
    // Динамический импорт pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    
    // Используем Times Roman для лучшей поддержки символов
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let y = height - 60;
    const margin = 50;

    const drawText = (text: string, size = 12, bold = false, color = rgb(0, 0, 0)) => {
      try {
        // Очищаем текст от проблемных символов и обеспечиваем UTF-8
        const cleanText = text
          .replace(/[^\u0000-\u00FF\u0100-\u017F\u0400-\u04FF]/g, '?') // Заменяем неподдерживаемые символы
          .normalize('NFC'); // Нормализуем Unicode
        
        page.drawText(cleanText, {
          x: margin,
          y,
          size,
          font: bold ? boldFont : font,
          color,
          maxWidth: width - 2 * margin
        });
      } catch (error) {
        console.warn('Ошибка отрисовки текста:', text, error);
        // Fallback - используем базовые ASCII символы
        const fallbackText = text.replace(/[^\x00-\x7F]/g, '?');
        page.drawText(fallbackText, {
          x: margin,
          y,
          size,
          font: bold ? boldFont : font,
          color,
          maxWidth: width - 2 * margin
        });
      }
      y -= size + 4;
    };

    // Заголовок
    drawText("Password & Entropy Lab — Отчёт анализа", 18, true, rgb(0.2, 0.2, 0.8));
    y -= 10;

    // Дата
    const date = new Date(assessment.timestamp).toLocaleString('ru-RU');
    drawText(`Дата анализа: ${date}`, 10, false, rgb(0.5, 0.5, 0.5));
    y -= 10;

    // Основные метрики
    drawText("ОСНОВНЫЕ ПОКАЗАТЕЛИ", 14, true, rgb(0.3, 0.3, 0.3));
    drawText(`Политика: ${assessment.policy_name}`);
    drawText(`Длина пароля: ${assessment.length} символов`);
    drawText(`Энтропия: ${assessment.entropy_bits} бит`);
    drawText(`Уровень силы: ${STRENGTH_LABELS[assessment.strength]} (${assessment.strength}/4)`);
    y -= 10;

    // Классы символов
    drawText("ИСПОЛЬЗУЕМЫЕ СИМВОЛЫ", 14, true, rgb(0.3, 0.3, 0.3));
    const classLabels = {
      lower: "Строчные буквы",
      upper: "Заглавные буквы", 
      digits: "Цифры",
      special: "Спецсимволы"
    };
    
    Object.entries(assessment.classes).forEach(([key, value]) => {
      const status = value ? "✓" : "✗";
      const color = value ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
      drawText(`${status} ${classLabels[key as keyof typeof classLabels]}`, 10, false, color);
    });
    y -= 10;

    // Соответствие политике
    drawText("СООТВЕТСТВИЕ ПОЛИТИКЕ", 14, true, rgb(0.3, 0.3, 0.3));
    assessment.compliance.forEach(rule => {
      const statusColor = rule.status === "PASS" ? rgb(0, 0.6, 0) : 
                         rule.status === "WARN" ? rgb(0.8, 0.6, 0) : rgb(0.8, 0, 0);
      drawText(`${rule.status}: ${rule.rule}`, 10, false, statusColor);
    });
    y -= 10;

    // Проблемы
    if (assessment.patterns.length > 0 || assessment.dictionary_hits.length > 0) {
      drawText("ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ", 14, true, rgb(0.8, 0, 0));
      
      assessment.patterns.forEach(pattern => {
        const label = PATTERN_LABELS[pattern] || pattern;
        drawText(`• ${label}`, 10, false, rgb(0.6, 0, 0));
      });
      
      assessment.dictionary_hits.forEach(hit => {
        drawText(`• Найден в словаре: ${hit.word}`, 10, false, rgb(0.6, 0, 0));
      });
      y -= 10;
    }

    // Рекомендации
    if (assessment.fix_suggestions.length > 0) {
      drawText("РЕКОМЕНДАЦИИ", 14, true, rgb(0, 0.5, 0));
      assessment.fix_suggestions.forEach(suggestion => {
        // Разбиваем длинные строки
        const words = suggestion.split(' ');
        let line = '';
        for (const word of words) {
          if (line.length + word.length > 70) {
            drawText(`• ${line}`, 10, false, rgb(0, 0.4, 0));
            line = word;
          } else {
            line += (line ? ' ' : '') + word;
          }
        }
        if (line) {
          drawText(`• ${line}`, 10, false, rgb(0, 0.4, 0));
        }
      });
    }

    // Подвал
    y = 50;
    drawText("Сгенерировано Password & Entropy Lab", 8, false, rgb(0.7, 0.7, 0.7));
    drawText("Все данные обработаны локально", 8, false, rgb(0.7, 0.7, 0.7));

    // Сохранение PDF
    const pdfBytes = await pdfDoc.save();
    downloadBlob(pdfBytes, `password-analysis-${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf');
    
    console.log("PDF успешно экспортирован");
  } catch (error) {
    console.error("Ошибка PDF экспорта:", error);
    // Fallback к альтернативному методу
    await exportPDFAlternative(assessment);
  }
}

// Функция для скачивания blob
function downloadBlob(data: any, filename: string, type: string) {
  try {
    // Обеспечиваем правильную кодировку для текстовых файлов
    const blobOptions: BlobPropertyBag = { type };
    if (type.includes('text') || type.includes('json')) {
      blobOptions.type = type + ';charset=utf-8';
    }
    
    const blob = new Blob([data], blobOptions);
    const url = URL.createObjectURL(blob);
    
    // Telegram WebApp совместимое скачивание
    if (window.Telegram?.WebApp) {
      // В Telegram WebApp используем другой подход
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Обычное скачивание
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Ошибка скачивания:", error);
    throw error;
  }
}

// Экспорт как текст (fallback)
function exportAsText(assessment: Assessment): void {
  const textContent = `
PASSWORD & ENTROPY LAB - ОТЧЁТ АНАЛИЗА

Дата: ${new Date(assessment.timestamp).toLocaleString('ru-RU')}
Политика: ${assessment.policy_name}

ОСНОВНЫЕ ПОКАЗАТЕЛИ:
• Длина пароля: ${assessment.length} символов
• Энтропия: ${assessment.entropy_bits} бит
• Уровень силы: ${STRENGTH_LABELS[assessment.strength]} (${assessment.strength}/4)

ИСПОЛЬЗУЕМЫЕ СИМВОЛЫ:
• Строчные буквы: ${assessment.classes.lower ? '✓' : '✗'}
• Заглавные буквы: ${assessment.classes.upper ? '✓' : '✗'}
• Цифры: ${assessment.classes.digits ? '✓' : '✗'}
• Спецсимволы: ${assessment.classes.special ? '✓' : '✗'}

СООТВЕТСТВИЕ ПОЛИТИКЕ:
${assessment.compliance.map(rule => `• ${rule.status}: ${rule.rule}`).join('\n')}

${assessment.patterns.length > 0 ? `ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:
${assessment.patterns.map(p => `• ${PATTERN_LABELS[p] || p}`).join('\n')}` : ''}

${assessment.fix_suggestions.length > 0 ? `РЕКОМЕНДАЦИИ:
${assessment.fix_suggestions.map(s => `• ${s}`).join('\n')}` : ''}

Сгенерировано Password & Entropy Lab
Все данные обработаны локально
  `.normalize('NFC'); // Нормализуем весь текст

  // Добавляем BOM для лучшей совместимости
  const utf8BOM = '\uFEFF';
  const finalContent = utf8BOM + textContent;

  downloadBlob(finalContent, `password-analysis-${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain');
}

// HTML для печати PDF
function generatePDFHTML(assessment: Assessment): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Analysis Report</title>
    <style>
        body { 
            font-family: 'Times New Roman', 'DejaVu Serif', serif; 
            margin: 20px; 
            line-height: 1.4;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        h1 { color: #333; text-align: center; }
        h2 { color: #666; border-bottom: 1px solid #ddd; }
        .metric { margin: 5px 0; }
        .pass { color: green; }
        .warn { color: orange; }
        .fail { color: red; }
        .suggestion { margin: 5px 0; padding-left: 20px; }
        @media print {
            body { margin: 0; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <h1>Password & Entropy Lab — Отчёт анализа</h1>
    <p><strong>Дата:</strong> ${new Date(assessment.timestamp).toLocaleString('ru-RU')}</p>
    <p><strong>Политика:</strong> ${assessment.policy_name}</p>
    
    <h2>Основные показатели</h2>
    <div class="metric"><strong>Длина:</strong> ${assessment.length} символов</div>
    <div class="metric"><strong>Энтропия:</strong> ${assessment.entropy_bits} бит</div>
    <div class="metric"><strong>Уровень:</strong> ${STRENGTH_LABELS[assessment.strength]} (${assessment.strength}/4)</div>
    
    <h2>Используемые символы</h2>
    <div class="metric">Строчные буквы: ${assessment.classes.lower ? '✓' : '✗'}</div>
    <div class="metric">Заглавные буквы: ${assessment.classes.upper ? '✓' : '✗'}</div>
    <div class="metric">Цифры: ${assessment.classes.digits ? '✓' : '✗'}</div>
    <div class="metric">Спецсимволы: ${assessment.classes.special ? '✓' : '✗'}</div>
    
    <h2>Соответствие политике</h2>
    ${assessment.compliance.map(rule => 
      `<div class="metric ${rule.status.toLowerCase()}">${rule.status}: ${rule.rule}</div>`
    ).join('')}
    
    ${assessment.patterns.length > 0 ? `
    <h2>Обнаруженные проблемы</h2>
    ${assessment.patterns.map(p => `<div class="suggestion">• ${PATTERN_LABELS[p] || p}</div>`).join('')}
    ` : ''}
    
    ${assessment.fix_suggestions.length > 0 ? `
    <h2>Рекомендации</h2>
    ${assessment.fix_suggestions.map(s => `<div class="suggestion">• ${s}</div>`).join('')}
    ` : ''}
    
    <hr>
    <p><small>Сгенерировано Password & Entropy Lab<br>Все данные обработаны локально</small></p>
</body>
</html>
  `;
}

export function exportJSON(assessment: Assessment): void {
  try {
    // Создаем копию объекта для очистки от проблемных символов
    const cleanAssessment = JSON.parse(JSON.stringify(assessment, (key, value) => {
      if (typeof value === 'string') {
        // Нормализуем строки для лучшей совместимости
        return value.normalize('NFC');
      }
      return value;
    }));
    
    const jsonData = JSON.stringify(cleanAssessment, null, 2);
    
    // Добавляем BOM для UTF-8 (помогает с кодировкой на Windows)
    const utf8BOM = '\uFEFF';
    const finalData = utf8BOM + jsonData;
    
    downloadBlob(finalData, `password-analysis-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    console.log("JSON успешно экспортирован");
  } catch (error) {
    console.error("Ошибка экспорта JSON:", error);
    alert("Ошибка при экспорте JSON");
  }
}