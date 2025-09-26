// /src/utils/exportPDF.ts
import type { Assessment, Policy } from "../core/assessPassword";

// Интерфейс для расширенного отчета
interface ExtendedAssessment extends Assessment {
  all_policies_analysis?: Record<string, Assessment>;
  selected_policy?: Policy;
  analysis_timestamp?: string;
  report_type?: string;
  summary?: {
    total_policies: number;
    passed_policies: number;
    failed_policies: number;
    warning_policies: number;
  };
  policies_summary?: Array<{
    name: string;
    display_name: string;
    category: string;
    compliance_status: string;
  }>;
}

// Функция транслитерации для максимальной совместимости
function transliterate(text: string): string {
  const cyrillicMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 
    'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    '—': '-', '–': '-', '«': '"', '»': '"'
  };
  
  return text.replace(/[А-Яа-яЁё—–«»]/g, (char) => cyrillicMap[char] || char);
}

const STRENGTH_LABELS = [
  "Ochen slabyy", 
  "Slabyy", 
  "Sredniy", 
  "Silnyy", 
  "Ochen silnyy"
];

const STRENGTH_LABELS_RU = [
  "Очень слабый", 
  "Слабый", 
  "Средний", 
  "Сильный", 
  "Очень сильный"
];

const PATTERN_LABELS: Record<string, string> = {
  repeat: "Povtoryayuschiesya simvoly",
  keyboard_seq: "Klaviaturnaya posledovatelnost", 
  numeric_seq: "Chislovaya posledovatelnost",
  year: "Soderzhit god",
  single_char: "Odin simvol",
  only_digits: "Tolko cifry"
};

const PATTERN_LABELS_RU: Record<string, string> = {
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
export async function exportPDF(assessment: ExtendedAssessment): Promise<void> {
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
        // Для PDF оставляем кириллицу, но очищаем проблемные символы
        const cleanText = text
          .replace(/[—–]/g, '-')  // Заменяем длинные тире
          .replace(/[«»]/g, '"')  // Заменяем кавычки-елочки
          .replace(/['']/g, "'"); // Заменяем фигурные апострофы
        
        page.drawText(cleanText, {
          x: margin,
          y,
          size,
          font: bold ? boldFont : font,
          color,
          maxWidth: width - 2 * margin
        });
      } catch (error) {
        console.warn('Ошибка отрисовки текста, используем транслитерацию:', text, error);
        // Fallback - транслитерация только при ошибке
        const fallbackText = transliterate(text);
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
    drawText(`Уровень силы: ${STRENGTH_LABELS_RU[assessment.strength]} (${assessment.strength}/4)`);
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
        const label = PATTERN_LABELS_RU[pattern] || pattern;
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

    // СВОДКА ПО ВСЕМ ПОЛИТИКАМ (если доступна)
    if (assessment.summary) {
      drawText("СВОДКА ПО ВСЕМ СТАНДАРТАМ БЕЗОПАСНОСТИ", 14, true, rgb(0.3, 0.3, 0.3));
      y -= 5;
      
      const summary = assessment.summary;
      drawText(`Всего стандартов: ${summary.total_policies}`, 10, false, rgb(0.3, 0.3, 0.3));
      drawText(`✅ Соответствует: ${summary.passed_policies}`, 10, false, rgb(0, 0.6, 0));
      drawText(`⚠️ Предупреждения: ${summary.warning_policies}`, 10, false, rgb(0.8, 0.6, 0));
      drawText(`❌ Не соответствует: ${summary.failed_policies}`, 10, false, rgb(0.8, 0, 0));
      y -= 10;
    }

    // ДЕТАЛЬНЫЙ АНАЛИЗ ПО ВСЕМ ПОЛИТИКАМ (если доступен)
    if (assessment.all_policies_analysis) {
      drawText("ДЕТАЛЬНЫЙ АНАЛИЗ ПО СТАНДАРТАМ", 14, true, rgb(0.3, 0.3, 0.3));
      y -= 5;
      
      const policies = Object.entries(assessment.all_policies_analysis);
      for (const [policyName, policyResult] of policies) {
        const passCount = policyResult.compliance.filter(c => c.status === "PASS").length;
        const warnCount = policyResult.compliance.filter(c => c.status === "WARN").length;
        const failCount = policyResult.compliance.filter(c => c.status === "FAIL").length;
        const totalCount = policyResult.compliance.length;
        
        const status = failCount > 0 ? "FAIL" : warnCount > 0 ? "WARN" : "PASS";
        const statusColor = status === "PASS" ? rgb(0, 0.6, 0) : status === "WARN" ? rgb(0.8, 0.6, 0) : rgb(0.8, 0, 0);
        
        drawText(`${status}: ${policyName}`, 12, true, statusColor);
        drawText(`  ✅ ${passCount} | ⚠️ ${warnCount} | ❌ ${failCount} из ${totalCount} требований`, 9, false, rgb(0.5, 0.5, 0.5));
        
        // Показываем детали для неудачных проверок
        if (failCount > 0 || warnCount > 0) {
          const failedRules = policyResult.compliance.filter(c => c.status === "FAIL" || c.status === "WARN");
          for (const rule of failedRules.slice(0, 3)) { // Показываем максимум 3 правила
            drawText(`    • ${rule.rule}`, 8, false, rule.status === "FAIL" ? rgb(0.8, 0, 0) : rgb(0.8, 0.6, 0));
            if (rule.details) {
              drawText(`      ${rule.details}`, 7, false, rgb(0.6, 0.6, 0.6));
            }
          }
          if (failedRules.length > 3) {
            drawText(`    ... и еще ${failedRules.length - 3} требований`, 8, false, rgb(0.6, 0.6, 0.6));
          }
        }
        
        y -= 5;
        
        // Проверяем, не выходим ли за пределы страницы
        if (y < 150) {
          // Добавляем новую страницу
          const newPage = pdfDoc.addPage([595, 842]);
          y = newPage.getSize().height - 60;
        }
      }
      y -= 10;
    }

    // Подвал
    if (y < 100) y = 100; // Минимальная позиция для подвала
    drawText("Сгенерировано Password & Entropy Lab", 8, false, rgb(0.7, 0.7, 0.7));
    drawText("Все данные обработаны локально", 8, false, rgb(0.7, 0.7, 0.7));
    if (assessment.analysis_timestamp) {
      drawText(`Создан: ${new Date(assessment.analysis_timestamp).toLocaleString('ru-RU')}`, 8, false, rgb(0.7, 0.7, 0.7));
    }

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
    // Используем стандартную кодировку без BOM для максимальной совместимости
    const blob = new Blob([data], { type });
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
• Уровень силы: ${STRENGTH_LABELS_RU[assessment.strength]} (${assessment.strength}/4)

ИСПОЛЬЗУЕМЫЕ СИМВОЛЫ:
• Строчные буквы: ${assessment.classes.lower ? '✓' : '✗'}
• Заглавные буквы: ${assessment.classes.upper ? '✓' : '✗'}
• Цифры: ${assessment.classes.digits ? '✓' : '✗'}
• Спецсимволы: ${assessment.classes.special ? '✓' : '✗'}

СООТВЕТСТВИЕ ПОЛИТИКЕ:
${assessment.compliance.map(rule => `• ${rule.status}: ${rule.rule}`).join('\n')}

${assessment.patterns.length > 0 ? `ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:
${assessment.patterns.map(p => `• ${PATTERN_LABELS_RU[p] || p}`).join('\n')}` : ''}

${assessment.fix_suggestions.length > 0 ? `РЕКОМЕНДАЦИИ:
${assessment.fix_suggestions.map(s => `• ${s}`).join('\n')}` : ''}

Сгенерировано Password & Entropy Lab
Все данные обработаны локально
  `;

  // Добавляем UTF-8 BOM для корректного отображения кириллицы
  const utf8BOM = '\uFEFF';
  const finalContent = utf8BOM + textContent;

  downloadBlob(finalContent, `password-analysis-${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8');
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

export function exportJSON(assessment: ExtendedAssessment): void {
  try {
    // Создаем полностью транслитерированную копию объекта
    const cleanAssessment = JSON.parse(JSON.stringify(assessment, (key, value) => {
      if (typeof value === 'string') {
        // Транслитерируем все строки в ASCII
        return transliterate(value);
      }
      return value;
    }));
    
    // Добавляем комментарий о транслитерации
    const exportData = {
      ...cleanAssessment,
      _note: "Text transliterated to ASCII for compatibility",
      _original_labels: {
        strength_levels: STRENGTH_LABELS_RU,
        pattern_labels: PATTERN_LABELS_RU
      }
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    
    downloadBlob(jsonData, `password-analysis-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    console.log("JSON uspeshno eksportirovan");
  } catch (error) {
    console.error("Oshibka eksporta JSON:", error);
    alert("Oshibka pri eksporte JSON");
  }
}