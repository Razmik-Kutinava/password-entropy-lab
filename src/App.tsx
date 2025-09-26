// /src/App.tsx
import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { assessPassword, assessPasswordAllPolicies, NIST_MODERATE, type Assessment, type Policy, ALL_POLICIES, POLICY_CATEGORIES } from "./core/assessPassword";
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
        openLink?(url: string): void;
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
  
  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = createSignal<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = createSignal(false);
  const [isInstalled, setIsInstalled] = createSignal(false);
  const [showInstallInstructions, setShowInstallInstructions] = createSignal(false);
  
  // Реактивный анализ пароля
  const result = createMemo(() => assessPassword(password(), selectedPolicy()));

  // Определение общего статуса
  const status = createMemo(() => {
    const comp = result().compliance;
    if (comp.some(c => c.status === "FAIL")) return "FAIL";
    if (comp.some(c => c.status === "WARN")) return "WARN";
    return "OK";
  });

  // PWA Install functions
  const handleInstallClick = async () => {
    if (deferredPrompt()) {
      // Показываем встроенное предложение установки
      deferredPrompt().prompt();
      const { outcome } = await deferredPrompt().userChoice;
      console.log(`PWA install outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Показываем инструкции для ручной установки
      setShowInstallInstructions(true);
    }
  };

  const detectInstallability = () => {
    // Проверяем, установлено ли уже приложение
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Проверяем параметры URL для показа инструкций
    const urlParams = new URLSearchParams(window.location.search);
    const fromTelegram = urlParams.get('from') === 'telegram';
    const showInstructions = urlParams.get('show_instructions') === 'true';
    
    console.log('URL params:', { fromTelegram, showInstructions, search: window.location.search });
    
    if (fromTelegram && showInstructions) {
      // Сразу показываем инструкции при переходе из Telegram
      console.log('Showing instructions from Telegram');
      setTimeout(() => {
        console.log('Setting showInstallInstructions to true');
        setShowInstallInstructions(true);
      }, 1000); // Небольшая задержка для загрузки интерфейса
      return;
    }

    // Проверяем, можно ли установить PWA
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Показываем предложение установки через 3 секунды после загрузки
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-offered')) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    }
  };

  // Инициализация Telegram WebApp и PWA
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
      console.log("Current URL:", window.location.href);
      console.log("Search params:", window.location.search);
      // Детекция PWA только вне Telegram
      detectInstallability();
    }

    // Обработчик события beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Обработчик события appinstalled
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });
  });

  const handlePasswordInput = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    setPassword(target.value);
  };

  const handleExportJSON = () => {
    if (password().length > 0) {
      // Создаем расширенный JSON отчет с анализом по всем политикам
      const allResults = assessPasswordAllPolicies(password());
      const extendedReport = {
        ...result(),
        all_policies_analysis: allResults,
        selected_policy: selectedPolicy(),
        analysis_timestamp: new Date().toISOString(),
        report_type: "COMPREHENSIVE_SECURITY_ANALYSIS",
        policies_summary: ALL_POLICIES.map(policy => ({
          name: policy.name,
          display_name: policy.display_name,
          category: policy.category,
          compliance_status: allResults[policy.name].compliance.every(c => c.status === "PASS") ? "PASS" : 
                            allResults[policy.name].compliance.some(c => c.status === "FAIL") ? "FAIL" : "WARN"
        }))
      };
      
      exportJSON(extendedReport);
    } else {
      alert("Введите пароль для анализа");
    }
  };

  const handleExportPDF = () => {
    if (password().length > 0) {
      // Создаем расширенный отчет с анализом по всем политикам
      const allResults = assessPasswordAllPolicies(password());
      const extendedReport = {
        ...result(),
        all_policies_analysis: allResults,
        selected_policy: selectedPolicy(),
        analysis_timestamp: new Date().toISOString(),
        report_type: "COMPREHENSIVE_SECURITY_ANALYSIS",
        summary: {
          total_policies: ALL_POLICIES.length,
          passed_policies: Object.values(allResults).filter(r => 
            r.compliance.every(c => c.status === "PASS")
          ).length,
          failed_policies: Object.values(allResults).filter(r => 
            r.compliance.some(c => c.status === "FAIL")
          ).length,
          warning_policies: Object.values(allResults).filter(r => 
            r.compliance.some(c => c.status === "WARN") && 
            !r.compliance.some(c => c.status === "FAIL")
          ).length
        }
      };
      
      exportPDF(extendedReport).catch(error => {
        console.error("PDF export failed:", error);
        alert("Ошибка экспорта PDF. Попробуйте JSON экспорт.");
      });
    } else {
      alert("Введите пароль для анализа");
    }
  };

  return (
    <div class="container">
      {/* 🎯 ЗАГОЛОВОК */}
      <header class="app-header">
        <h1 class="app-title">🔐 Password & Entropy Lab</h1>
        <p class="app-subtitle">Профессиональный анализ безопасности паролей</p>
        
        {/* 📱 КНОПКИ УСТАНОВКИ PWA */}
        <div style="margin-top: 16px; display: flex; gap: 12px; flex-direction: column;">
          {/* Основная кнопка установки */}
          <button 
            class="install-pwa-btn"
            onClick={() => {
              if (typeof window.Telegram?.WebApp !== "undefined") {
                // В Telegram Mini App - открываем в браузере
                const webUrl = 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true';
                if (window.Telegram.WebApp.openLink) {
                  window.Telegram.WebApp.openLink(webUrl);
                } else {
                  // Fallback для старых версий
                  window.open(webUrl, '_blank');
                }
              } else {
                // В обычном браузере - проверяем параметры URL
                const urlParams = new URLSearchParams(window.location.search);
                const fromTelegram = urlParams.get('from') === 'telegram';
                const showInstructions = urlParams.get('show_instructions') === 'true';
                
                console.log('Button click in browser:', { fromTelegram, showInstructions });
                
                if (fromTelegram && showInstructions) {
                  // Если пришли из Telegram - показываем инструкции
                  console.log('Showing instructions from button click');
                  setShowInstallInstructions(true);
                } else {
                  // Обычная логика PWA установки
                  handleInstallClick();
                }
              }
            }}
            style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              border-radius: 12px;
              padding: 12px 20px;
              color: white;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
              width: 100%;
              justify-content: center;
            "
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
            }}
          >
            {(() => {
              if (typeof window.Telegram?.WebApp !== "undefined") {
                return "📱 Установить приложение";
              } else {
                const urlParams = new URLSearchParams(window.location.search);
                const fromTelegram = urlParams.get('from') === 'telegram';
                const showInstructions = urlParams.get('show_instructions') === 'true';
                
                if (fromTelegram && showInstructions) {
                  return "📋 Показать инструкции";
                } else {
                  return "📱 Установить приложение";
                }
              }
            })()}
            <span style="font-size: 12px; opacity: 0.9;">→</span>
          </button>

          {/* Кнопка инструкций */}
          <button 
            onClick={() => setShowInstallInstructions(true)}
            style="
              background: linear-gradient(135deg, #00c851 0%, #00ff88 100%);
              border: none;
              border-radius: 12px;
              padding: 10px 16px;
              color: white;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 4px 16px rgba(0, 200, 81, 0.3);
              transition: all 0.3s ease;
              width: 100%;
              justify-content: center;
            "
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 200, 81, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 200, 81, 0.3)';
            }}
          >
            📋 Прочитать инструкцию
            <span style="font-size: 12px; opacity: 0.9;">?</span>
          </button>

          <div style="
            font-size: 11px; 
            color: var(--text-secondary); 
            text-align: center; 
            margin-top: 8px;
            line-height: 1.3;
          ">
            💡 Установите полноценное приложение для работы офлайн
          </div>
        </div>
      </header>

      {/* 🚀 АВТОМАТИЧЕСКОЕ ПРЕДЛОЖЕНИЕ УСТАНОВКИ PWA */}
      <Show when={showInstallPrompt() && !isInstalled()}>
        <div style="
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          background: linear-gradient(135deg, #00c851 0%, #00ff88 100%);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 200, 81, 0.3);
          z-index: 1000;
          animation: slideInDown 0.5s ease-out;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">
              📱
            </div>
            <div>
              <div style="font-weight: 700; color: white; font-size: 16px;">
                Установите SecPass!
              </div>
              <div style="font-size: 13px; color: rgba(255, 255, 255, 0.9);">
                Получите полноценное приложение с офлайн работой
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button
              onClick={handleInstallClick}
              style="
                flex: 1;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                padding: 10px 16px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
              "
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🚀 Установить
            </button>
            <button
              onClick={() => {
                setShowInstallPrompt(false);
                localStorage.setItem('pwa-install-offered', 'true');
              }}
              style="
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                padding: 10px 16px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
              "
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Позже
            </button>
          </div>
        </div>
      </Show>

      {/* 📋 ИНСТРУКЦИИ ДЛЯ ANDROID */}
      <Show when={showInstallInstructions()}>
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: var(--card-bg);
            border-radius: 20px;
            padding: 24px;
            max-width: 400px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
          ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative;">
              <div style="
                background: linear-gradient(135deg, #00c851 0%, #00ff88 100%);
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                animation: pulse 2s infinite;
              ">
                📱
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--text-primary); font-size: 18px;">
                  🚀 Установите SecPass на рабочий стол!
                </div>
                <div style="font-size: 14px; color: var(--text-secondary);">
                  Следуйте инструкции ниже для вашего устройства
                </div>
              </div>
              
              {/* Кнопка закрытия */}
              <button
                onClick={() => setShowInstallInstructions(false)}
                style="
                  position: absolute;
                  top: -8px;
                  right: -8px;
                  background: rgba(255, 68, 68, 0.9);
                  border: none;
                  border-radius: 50%;
                  width: 32px;
                  height: 32px;
                  color: white;
                  font-weight: bold;
                  font-size: 16px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3);
                "
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 1)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="
                background: rgba(102, 126, 234, 0.1);
                border-left: 4px solid #667eea;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;
              ">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                  🤖 Для Android (Chrome/Samsung):
                </div>
                <ol style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.6;">
                  <li>Нажмите на меню браузера (три точки ⋮ в правом верхнем углу)</li>
                  <li>Найдите "Установить приложение" или "Добавить на главный экран"</li>
                  <li>Нажмите "Установить" в появившемся окне</li>
                  <li>Готово! Иконка SecPass появится на рабочем столе</li>
                </ol>
                <div style="
                  background: rgba(102, 126, 234, 0.05);
                  padding: 8px 12px;
                  border-radius: 6px;
                  margin-top: 8px;
                  font-size: 12px;
                  color: var(--text-secondary);
                  font-style: italic;
                ">
                  💡 Если не видите "Установить приложение", попробуйте обновить страницу
                </div>
              </div>

              <div style="
                background: rgba(0, 200, 81, 0.1);
                border-left: 4px solid #00c851;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;
              ">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                  🍎 Для iPhone (Safari):
                </div>
                <ol style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.6;">
                  <li>Нажмите кнопку "Поделиться" (квадрат со стрелкой вниз)</li>
                  <li>Прокрутите вниз и найдите "На экран Домой"</li>
                  <li>Нажмите "Добавить" в правом верхнем углу</li>
                  <li>Готово! Иконка SecPass появится на главном экране</li>
                </ol>
                <div style="
                  background: rgba(0, 200, 81, 0.05);
                  padding: 8px 12px;
                  border-radius: 6px;
                  margin-top: 8px;
                  font-size: 12px;
                  color: var(--text-secondary);
                  font-style: italic;
                ">
                  💡 Кнопка "Поделиться" находится в нижней части экрана
                </div>
              </div>

              <div style="
                background: rgba(255, 136, 0, 0.1);
                border-left: 4px solid #ff8800;
                padding: 16px;
                border-radius: 8px;
              ">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                  💻 Для компьютера (Chrome/Edge):
                </div>
                <ol style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.6;">
                  <li>Найдите иконку установки 📱 в адресной строке (справа)</li>
                  <li>Нажмите "Установить SecPass" в появившемся окне</li>
                  <li>Подтвердите установку кнопкой "Установить"</li>
                  <li>Готово! Приложение появится в меню Пуск</li>
                </ol>
                <div style="
                  background: rgba(255, 136, 0, 0.05);
                  padding: 8px 12px;
                  border-radius: 6px;
                  margin-top: 8px;
                  font-size: 12px;
                  color: var(--text-secondary);
                  font-style: italic;
                ">
                  💡 Иконка установки может появиться не сразу, подождите несколько секунд
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 12px;">
              <button
                onClick={() => setShowInstallInstructions(false)}
                style="
                  flex: 1;
                  background: linear-gradient(135deg, #00c851 0%, #00ff88 100%);
                  border: none;
                  border-radius: 12px;
                  padding: 12px 20px;
                  color: white;
                  font-weight: 600;
                  font-size: 14px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 16px rgba(0, 200, 81, 0.3);
                "
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 200, 81, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 200, 81, 0.3)';
                }}
              >
                ✅ Понятно, спасибо!
              </button>
            </div>
          </div>
        </div>
      </Show>
      
      {/* 🛡️ СЕЛЕКТОР ПОЛИТИКИ БЕЗОПАСНОСТИ */}
      <div class="policy-selector">
        <div class="policy-selector-header">
          <label class="policy-label">
            🛡️ Стандарт безопасности
          </label>
          <button
            class="policy-current glow-animation"
            onClick={() => setShowPolicySelector(!showPolicySelector())}
          >
            {selectedPolicy().icon} {selectedPolicy().display_name}
            <span>{showPolicySelector() ? "▲" : "▼"}</span>
          </button>
        </div>
        
        <Show when={showPolicySelector()}>
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            margin-top: 16px;
            backdrop-filter: blur(10px);
          ">
            {/* 📂 КАТЕГОРИИ */}
            <div class="category-tabs">
              <For each={Object.entries(POLICY_CATEGORIES)}>
                {([key, category]) => (
                  <button
                    class={`category-tab ${activeCategory() === key ? 'active' : ''}`}
                    onClick={() => setActiveCategory(key as keyof typeof POLICY_CATEGORIES)}
                  >
                    {category.title}
                  </button>
                )}
              </For>
            </div>
            
            {/* 📋 ОПИСАНИЕ КАТЕГОРИИ */}
            <div style="
              background: rgba(0, 102, 204, 0.1);
              border-left: 4px solid var(--primary-blue);
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 20px;
            ">
              <p style="
                color: var(--text-secondary);
                font-size: 14px;
                margin: 0;
                font-style: italic;
              ">
                💡 {POLICY_CATEGORIES[activeCategory()].description}
              </p>
            </div>
            
            {/* 🛡️ ПОЛИТИКИ */}
            <div class="policy-grid">
              <For each={POLICY_CATEGORIES[activeCategory()].policies}>
                {(policy) => (
                  <button
                    class={`policy-item ${selectedPolicy().name === policy.name ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setShowPolicySelector(false);
                    }}
                    style={`
                      border-color: ${selectedPolicy().name === policy.name ? policy.color : 'var(--border-color)'};
                    `}
                  >
                    <div class="policy-icon" style={`
                      background: linear-gradient(135deg, ${policy.color}, ${policy.color}dd);
                      box-shadow: 0 4px 16px ${policy.color}40;
                    `}>
                      {policy.icon}
                    </div>
                    <div class="policy-info">
                      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 16px;">
                        {policy.display_name}
                      </div>
                      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px;">
                        {policy.description}
                      </div>
                      <div class="policy-meta">
                        <span class="meta-tag">
                          📏 {policy.min_length}+ симв.
                        </span>
                        <span class="meta-tag" style="
                          background: rgba(0, 200, 81, 0.2);
                          border-color: rgba(0, 200, 81, 0.3);
                        ">
                          ⚡ {policy.min_entropy || 30}+ бит
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
      
      {/* 🔐 ПОЛЕ ВВОДА ПАРОЛЯ */}
      <div class="input-container">
        <input
          type={showPassword() ? "text" : "password"}
          class="input-field"
          placeholder="🔑 Введите пароль для профессионального анализа..."
          onInput={handlePasswordInput}
          value={password()}
        />
        <button
          class="password-toggle"
          onClick={() => setShowPassword(!showPassword())}
          title={showPassword() ? "Скрыть пароль" : "Показать пароль"}
        >
          {showPassword() ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Показываем анализ только если есть пароль */}
      {password().length > 0 && (
        <>
          {/* 🎯 ТЕКУЩИЙ СТАНДАРТ */}
          <div class="section" style={`
            background: linear-gradient(135deg, ${selectedPolicy().color}15, ${selectedPolicy().color}08);
            border: 2px solid ${selectedPolicy().color};
            box-shadow: 0 4px 16px ${selectedPolicy().color}30;
          `}>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style={`
                background: linear-gradient(135deg, ${selectedPolicy().color}, ${selectedPolicy().color}dd);
                color: white;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
                box-shadow: 0 4px 16px ${selectedPolicy().color}40;
              `}>
                {selectedPolicy().icon}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px; font-size: 18px;">
                  🎯 Анализ по стандарту: {selectedPolicy().display_name}
                </div>
                <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.4;">
                  {selectedPolicy().description}
                </div>
              </div>
            </div>
          </div>

          {/* 📊 ВЕРДИКТ */}
          <div class={`status-card ${
            status() === "OK" ? "status-ok" : 
            status() === "WARN" ? "status-warn" : "status-fail"
          }`}>
            <div style="font-size: 20px; margin-bottom: 8px;">
              {status() === "OK" ? "🛡️" : status() === "WARN" ? "⚠️" : "🚨"}
            </div>
            <strong>ВЕРДИКТ СИСТЕМЫ БЕЗОПАСНОСТИ</strong>
            <div style="margin-top: 8px; font-size: 15px;">
              {status() === "OK" ? "✅ Пароль соответствует стандарту безопасности" : 
               status() === "WARN" ? "⚠️ Обнаружены предупреждения безопасности" : 
               "❌ Пароль НЕ соответствует стандарту безопасности"}
            </div>
          </div>

          {/* 📈 ОСНОВНЫЕ МЕТРИКИ */}
          <div class="section">
            <div class="section-title">📈 Технические показатели</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="metric">
                <strong>📏 Длина:</strong><br/>
                <span style="font-size: 18px; color: var(--primary-blue);">{result().length}</span> символов
            </div>
            <div class="metric">
                <strong>⚡ Энтропия:</strong><br/>
                <span style="font-size: 18px; color: var(--success-green);">{result().entropy_bits}</span> бит
              </div>
            </div>
            <div class="metric" style="text-align: center; margin-top: 12px;">
              <strong>🏆 Уровень силы:</strong><br/>
              <span style={`
                font-size: 20px; 
                font-weight: 700;
                color: ${result().strength >= 3 ? 'var(--success-green)' : 
                        result().strength >= 2 ? 'var(--warning-orange)' : 'var(--danger-red)'};
              `}>
                {STRENGTH_LABELS[result().strength]} ({result().strength}/4)
              </span>
            </div>
          </div>

          {/* 🔤 КЛАССЫ СИМВОЛОВ */}
          <div class="section">
            <div class="section-title">🔤 Анализ символов</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class={`chip ${result().classes.lower ? 'chip-success' : 'chip-danger'}`}>
                {result().classes.lower ? "✅" : "❌"} Строчные буквы
              </div>
              <div class={`chip ${result().classes.upper ? 'chip-success' : 'chip-danger'}`}>
                {result().classes.upper ? "✅" : "❌"} Заглавные буквы
              </div>
              <div class={`chip ${result().classes.digits ? 'chip-success' : 'chip-danger'}`}>
                {result().classes.digits ? "✅" : "❌"} Цифры
              </div>
              <div class={`chip ${result().classes.special ? 'chip-success' : 'chip-danger'}`}>
                {result().classes.special ? "✅" : "❌"} Спецсимволы
              </div>
            </div>
          </div>

          {/* 📋 ДЕТАЛЬНОЕ СООТВЕТСТВИЕ ПОЛИТИКЕ */}
          <div class="section">
            <div class="section-title">📋 Соответствие стандарту {selectedPolicy().display_name}:</div>
            <For each={result().compliance}>
              {(rule) => (
                <div style={`
                  background: ${rule.status === "PASS" ? "rgba(0, 200, 81, 0.1)" : 
                              rule.status === "WARN" ? "rgba(255, 187, 51, 0.1)" : "rgba(255, 68, 68, 0.1)"};
                  border: 1px solid ${rule.status === "PASS" ? "rgba(0, 200, 81, 0.3)" : 
                              rule.status === "WARN" ? "rgba(255, 187, 51, 0.3)" : "rgba(255, 68, 68, 0.3)"};
                  border-radius: 12px;
                  padding: 12px;
                  margin-bottom: 8px;
                `}>
                  <div style={`
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: ${rule.status === "PASS" ? "var(--success-green)" : 
                            rule.status === "WARN" ? "var(--warning-orange)" : "var(--danger-red)"};
                    margin-bottom: 4px;
                  `}>
                    {rule.status === "PASS" ? "✅" : rule.status === "WARN" ? "⚠️" : "❌"} 
                    {rule.rule}
                  </div>
                  {rule.details && (
                    <div style={`
                      font-size: 12px;
                      color: var(--text-secondary);
                      margin-left: 24px;
                      font-style: italic;
                    `}>
                      💡 {rule.details}
                    </div>
                  )}
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

          {/* 🔒 ИНФОРМАЦИЯ О БЕЗОПАСНОСТИ */}
          <div class="section" style="
            background: linear-gradient(135deg, rgba(0, 200, 81, 0.1), rgba(0, 200, 81, 0.05));
            border: 2px solid rgba(0, 200, 81, 0.3);
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: var(--gradient-matrix);
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
              ">
                🔒
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  🛡️ Гарантия конфиденциальности
                </div>
                <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                  Весь анализ выполняется локально в вашем браузере. Пароли не передаются по сети и не сохраняются на серверах.
                </div>
              </div>
            </div>
          </div>

          {/* 📊 ЭКСПОРТ ОТЧЕТОВ - ПЕРЕМЕЩЕНО ВНИЗ */}
          <div class="section" style="margin-top: 20px;">
            <div class="section-title">📊 Экспорт отчетов</div>
            <div class="export-buttons">
              <button class="btn btn-secondary" onClick={handleExportJSON}>
                <div class="btn-icon">📊</div>
                <div class="btn-text">JSON</div>
                <div class="btn-subtext">Данные</div>
              </button>
              <button class="btn btn-primary" onClick={handleExportPDF}>
                <div class="btn-icon">📋</div>
                <div class="btn-text">PDF</div>
                <div class="btn-subtext">Отчет</div>
              </button>
            </div>
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
