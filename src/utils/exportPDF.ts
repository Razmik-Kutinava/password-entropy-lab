// /src/utils/exportPDF.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

export async function exportPDF(assessment: Assessment): Promise<void> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 размер
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 60;
    const margin = 50;
    const lineHeight = 20;

    // Функция для рисования текста
    const drawText = (text: string, size = 12, bold = false, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x: margin,
        y,
        size,
        font: bold ? boldFont : font,
        color,
        maxWidth: width - 2 * margin
      });
      y -= size + 4;
    };

    // Заголовок
    drawText("Password & Entropy Lab — Отчёт анализа пароля", 18, true, rgb(0.2, 0.2, 0.8));
    y -= 10;

    // Дата и время
    const date = new Date(assessment.timestamp).toLocaleString('ru-RU');
    drawText(`Дата анализа: ${date}`, 10, false, rgb(0.5, 0.5, 0.5));
    y -= 10;

    // Политика безопасности
    drawText(`Политика: ${assessment.policy_name}`, 12, true);
    y -= 5;

    // Основные метрики
    drawText("ОСНОВНЫЕ ПОКАЗАТЕЛИ", 14, true, rgb(0.3, 0.3, 0.3));
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

    // Обнаруженные проблемы
    if (assessment.patterns.length > 0 || assessment.dictionary_hits.length > 0) {
      drawText("ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ", 14, true, rgb(0.8, 0, 0));
      
      assessment.patterns.forEach(pattern => {
        const label = PATTERN_LABELS[pattern] || pattern;
        drawText(`• ${label}`, 10, false, rgb(0.6, 0, 0));
      });
      
      assessment.dictionary_hits.forEach(hit => {
        drawText(`• Найден в словаре: ${hit.word} (${hit.dict})`, 10, false, rgb(0.6, 0, 0));
      });
      y -= 10;
    }

    // Рекомендации
    if (assessment.fix_suggestions.length > 0) {
      drawText("РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ", 14, true, rgb(0, 0.5, 0));
      assessment.fix_suggestions.forEach(suggestion => {
        // Переносим длинные строки
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
      y -= 10;
    }

    // Подвал
    y = 50;
    drawText("Сгенерировано Password & Entropy Lab", 8, false, rgb(0.7, 0.7, 0.7));
    drawText("Все данные обработаны локально, пароль не передавался по сети", 8, false, rgb(0.7, 0.7, 0.7));

    // Сохранение PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `password-analysis-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("PDF успешно экспортирован");
  } catch (error) {
    console.error("Ошибка при создании PDF:", error);
    alert("Ошибка при экспорте PDF. Попробуйте ещё раз.");
  }
}

export function exportJSON(assessment: Assessment): void {
  try {
    const jsonData = JSON.stringify(assessment, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `password-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("JSON успешно экспортирован");
  } catch (error) {
    console.error("Ошибка при экспорте JSON:", error);
    alert("Ошибка при экспорте JSON. Попробуйте ещё раз.");
  }
}
