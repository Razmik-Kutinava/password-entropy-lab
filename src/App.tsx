// /src/App.tsx
import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { assessPassword, NIST_MODERATE, type Assessment, type Policy, ALL_POLICIES, POLICY_CATEGORIES } from "./core/assessPassword";
import { exportPDF, exportJSON } from "./utils/exportPDF";

// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        close(): void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
        };
        BackButton: {
          isVisible: boolean;
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        showAlert?(message: string): void;
        showPopup?(params: any): void;
      };
    };
  }
}

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
  year: "Содержит год (1990-2025)",
  single_char: "Один символ",
  only_digits: "Только цифры"
};

export default function App() {
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [selectedPolicy, setSelectedPolicy] = createSignal<Policy>(NIST_MODERATE);
  const [showPolicySelector, setShowPolicySelector] = createSignal(false);
  const [activeCategory, setActiveCategory] = createSignal<keyof typeof POLICY_CATEGORIES>("basic");
  
  // Реактивный анализ пароля
  const result = createMemo(() => assessPassword(password(), selectedPolicy()));

  // Определение общего статуса
  const status = createMemo(() => {
    const comp = result().compliance;
    if (comp.some(c => c.status === "FAIL")) return "FAIL";
    if (comp.some(c => c.status === "WARN")) return "WARN";
    return "OK";
  });

  // Инициализация Telegram WebApp
  onMount(() => {
    if (typeof window.Telegram?.WebApp !== "undefined") {
      const tg = window.Telegram.WebApp;
      
      // Инициализация
      tg.ready();
      tg.expand();
      
      // Настройка главной кнопки
      tg.MainButton.setText("📄 Экспорт PDF");
      tg.MainButton.show();
      tg.MainButton.onClick(() => {
        if (password().length > 0) {
          console.log("MainButton PDF export clicked");
          exportPDF(result()).catch(error => {
            console.error("PDF export failed:", error);
            tg.showAlert?.("Ошибка экспорта PDF. Попробуйте JSON экспорт.") || 
            alert("Ошибка экспорта PDF. Попробуйте JSON экспорт.");
          });
        } else {
          tg.showAlert?.("Введите пароль для анализа") || 
          alert("Введите пароль для анализа");
        }
      });

      console.log("Telegram WebApp инициализирован");
      console.log("Тема:", tg.colorScheme);
      console.log("Параметры темы:", tg.themeParams);
    } else {
      console.log("Запуск вне Telegram WebApp");
    }
  });

  const handlePasswordInput = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    setPassword(target.value);
  };

  const handleExportJSON = () => {
    if (password().length > 0) {
      exportJSON(result());
    } else {
      alert("Введите пароль для анализа");
    }
  };

  const handleExportPDF = () => {
    if (password().length > 0) {
      exportPDF(result());
    } else {
      alert("Введите пароль для анализа");
    }
  };

  return (
    <div class="container">
      <h1 style="text-align: center; margin-bottom: 24px; color: var(--tg-theme-text-color, #000);">
        🔐 Password & Entropy Lab
      </h1>
      
      {/* Селектор политики безопасности */}
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <label style="font-weight: bold; color: var(--tg-theme-text-color, #333);">
            🛡️ Политика безопасности:
          </label>
          <button
            onClick={() => setShowPolicySelector(!showPolicySelector())}
            style={`
              background: ${selectedPolicy().color}; 
              color: white; 
              border: none; 
              border-radius: 20px; 
              padding: 8px 16px; 
              cursor: pointer; 
              font-size: 14px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: all 0.2s ease;
            `}
          >
            {selectedPolicy().icon} {selectedPolicy().display_name}
            <span style="margin-left: 4px;">{showPolicySelector() ? "▲" : "▼"}</span>
          </button>
        </div>
        
        <Show when={showPolicySelector()}>
          <div style="
            background: var(--tg-theme-bg-color, #f8f9fa);
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
          ">
            {/* Категории */}
            <div style="display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px;">
              <For each={Object.entries(POLICY_CATEGORIES)}>
                {([key, category]) => (
                  <button
                    onClick={() => setActiveCategory(key as keyof typeof POLICY_CATEGORIES)}
                    style={`
                      background: ${activeCategory() === key ? '#3b82f6' : 'transparent'};
                      color: ${activeCategory() === key ? 'white' : 'var(--tg-theme-text-color, #666)'};
                      border: 1px solid ${activeCategory() === key ? '#3b82f6' : '#ddd'};
                      border-radius: 20px;
                      padding: 8px 16px;
                      cursor: pointer;
                      font-size: 12px;
                      font-weight: bold;
                      white-space: nowrap;
                      transition: all 0.2s ease;
                    `}
                  >
                    {category.title}
                  </button>
                )}
              </For>
            </div>
            
            {/* Описание категории */}
            <p style="
              color: var(--tg-theme-hint-color, #666);
              font-size: 13px;
              margin: 0 0 16px 0;
              font-style: italic;
            ">
              {POLICY_CATEGORIES[activeCategory()].description}
            </p>
            
            {/* Политики */}
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
              <For each={POLICY_CATEGORIES[activeCategory()].policies}>
                {(policy) => (
                  <button
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setShowPolicySelector(false);
                    }}
                    style={`
                      background: ${selectedPolicy().name === policy.name ? policy.color + '20' : 'transparent'};
                      border: 2px solid ${selectedPolicy().name === policy.name ? policy.color : '#e5e7eb'};
                      border-radius: 12px;
                      padding: 12px;
                      cursor: pointer;
                      text-align: left;
                      transition: all 0.2s ease;
                      display: flex;
                      align-items: center;
                      gap: 12px;
                    `}
                  >
                    <div style={`
                      background: ${policy.color};
                      color: white;
                      border-radius: 50%;
                      width: 40px;
                      height: 40px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 18px;
                      flex-shrink: 0;
                    `}>
                      {policy.icon}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: bold; color: var(--tg-theme-text-color, #333); margin-bottom: 4px;">
                        {policy.display_name}
                      </div>
                      <div style="font-size: 12px; color: var(--tg-theme-hint-color, #666); line-height: 1.3;">
                        {policy.description}
                      </div>
                      <div style="font-size: 11px; color: var(--tg-theme-hint-color, #888); margin-top: 4px;">
                        Мин. длина: {policy.min_length} • Энтропия: {policy.min_entropy || 30}+ бит
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
      
      <div style="position: relative; margin-bottom: 16px;">
        <input
          type={showPassword() ? "text" : "password"}
          class="input-field"
          placeholder="Введите пароль для анализа..."
          onInput={handlePasswordInput}
          value={password()}
          style="padding-right: 50px;"
        />
        <button
          onClick={() => setShowPassword(!showPassword())}
          style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px;"
          title={showPassword() ? "Скрыть пароль" : "Показать пароль"}
        >
          {showPassword() ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Показываем анализ только если есть пароль */}
      {password().length > 0 && (
        <>
          {/* Текущая политика */}
          <div style={`
            background: ${selectedPolicy().color}15;
            border: 2px solid ${selectedPolicy().color};
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
          `}>
            <div style={`
              background: ${selectedPolicy().color};
              color: white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              flex-shrink: 0;
            `}>
              {selectedPolicy().icon}
            </div>
            <div>
              <div style="font-weight: bold; color: var(--tg-theme-text-color, #333);">
                Проверка по стандарту: {selectedPolicy().display_name}
              </div>
              <div style="font-size: 12px; color: var(--tg-theme-hint-color, #666);">
                {selectedPolicy().description}
              </div>
            </div>
          </div>

          {/* Статус */}
          <div class={`status-card ${
            status() === "OK" ? "status-ok" : 
            status() === "WARN" ? "status-warn" : "status-fail"
          }`}>
            <strong>Вердикт: </strong>
            {status() === "OK" ? "✅ Пароль соответствует требованиям" : 
             status() === "WARN" ? "⚠️ Есть предупреждения" : 
             "❌ Пароль не соответствует требованиям"}
          </div>

          {/* Основные метрики */}
          <div class="section">
            <div class="metric">
              <strong>Длина:</strong> {result().length} символов
            </div>
            <div class="metric">
              <strong>Энтропия:</strong> {result().entropy_bits} бит
            </div>
            <div class="metric">
              <strong>Уровень силы:</strong> {STRENGTH_LABELS[result().strength]} ({result().strength}/4)
            </div>
          </div>

          {/* Классы символов */}
          <div class="section">
            <div class="section-title">Используемые символы:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                result().classes.lower ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'
              }`}>
                {result().classes.lower ? "✓" : "✗"} Строчные
              </span>
              <span style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                result().classes.upper ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'
              }`}>
                {result().classes.upper ? "✓" : "✗"} Заглавные
              </span>
              <span style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                result().classes.digits ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'
              }`}>
                {result().classes.digits ? "✓" : "✗"} Цифры
              </span>
              <span style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                result().classes.special ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'
              }`}>
                {result().classes.special ? "✓" : "✗"} Спецсимволы
              </span>
            </div>
          </div>

          {/* Соответствие политике */}
          <div class="section">
            <div class="section-title">Соответствие политике NIST:</div>
            <For each={result().compliance}>
              {(rule) => (
                <div style={`font-size: 14px; margin-bottom: 4px; ${
                  rule.status === "PASS" ? "color: #155724;" : 
                  rule.status === "WARN" ? "color: #856404;" : "color: #721c24;"
                }`}>
                  {rule.status === "PASS" ? "✅" : rule.status === "WARN" ? "⚠️" : "❌"} {rule.rule}
                </div>
              )}
            </For>
          </div>

          {/* Обнаруженные проблемы */}
          {(result().patterns.length > 0 || result().dictionary_hits.length > 0) && (
            <div class="section">
              <div class="section-title" style="color: #721c24;">❌ Обнаруженные проблемы:</div>
              <ul class="issue-list">
                <For each={result().patterns}>
                  {(pattern) => (
                    <li>{PATTERN_LABELS[pattern] || pattern}</li>
                  )}
                </For>
                <For each={result().dictionary_hits}>
                  {(hit) => (
                    <li>Найден в словаре популярных паролей: "{hit.word}"</li>
                  )}
                </For>
              </ul>
            </div>
          )}

          {/* Рекомендации */}
          {result().fix_suggestions.length > 0 && (
            <div class="section">
              <div class="section-title" style="color: #155724;">💡 Рекомендации:</div>
              <ul class="suggestion-list">
                <For each={result().fix_suggestions}>
                  {(suggestion) => <li>{suggestion}</li>}
                </For>
              </ul>
            </div>
          )}

          {/* Кнопки экспорта */}
          <div class="export-buttons">
            <button class="btn btn-secondary" onClick={handleExportJSON}>
              📄 JSON
            </button>
            <button class="btn btn-primary" onClick={handleExportPDF}>
              📄 PDF
            </button>
          </div>

          {/* Информация о приватности */}
          <div style="margin-top: 16px; padding: 12px; background: #e7f3ff; border-radius: 8px; font-size: 12px; color: #0c5460;">
            🔒 <strong>Приватность:</strong> Ваш пароль анализируется только локально в браузере. 
            Никакие данные не передаются по сети и не сохраняются на сервере.
          </div>
        </>
      )}

      {/* Подсказка если пароль не введен */}
      {password().length === 0 && (
        <div style="text-align: center; color: #6c757d; margin-top: 40px;">
          <p>👆 Введите пароль выше для анализа</p>
          <div style="font-size: 12px; margin-top: 16px;">
            <p><strong>Что проверяется:</strong></p>
            <ul style="text-align: left; display: inline-block; margin: 0; padding-left: 20px;">
              <li>Длина и сложность</li>
              <li>Энтропия (случайность)</li>
              <li>Популярные пароли</li>
              <li>Клавиатурные паттерны</li>
              <li>Повторы и последовательности</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
