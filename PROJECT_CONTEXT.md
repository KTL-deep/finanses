# 🧠 PROJECT_CONTEXT.md — Память и архитектурный контекст проекта

> **Назначение файла**: Этот документ содержит полную память о проекте, архитектурных решениях, конфигурациях, пользователях, деплое и нюансах мобильного приложения. Используется ассистентом в будущих сессиях для мгновенного погружения в контекст без необходимости повторного исследования файлов.

---

## 📌 1. Основная информация о проекте

- **Название**: Финансы Семьи (Family Financial Architecture).
- **Пользователи**: Тимур и Лера.
- **Репозиторий GitHub**: `https://github.com/KTL-deep/finanses.git` (ветка `main`).
- **Сервер VPS (Production)**: `94.154.11.219`, порт `3000` (`http://94.154.11.219:3000`).
- **Android App ID**: `com.familyfinance.app` («Финансы Семьи»).

---

## 🏗 2. Технологический стек

- **Фронтенд**: React 18, TypeScript, Vite 6, Tailwind CSS, shadcn/ui, Lucide Icons, Chart.js (`react-chartjs-2`).
- **Бэкенд**: Node.js 24 (ES Modules, `server.js`), Express 4.
- **База данных**: SQLite через встроенный в Node.js модуль `node:sqlite` (`DatabaseSync`), файл БД: `data/finance.db`.
- **Мобильная платформа**: Capacitor 8 (`@capacitor/android`, `@capacitor/cli`, `@capacitor/core`).
- **Контейнеризация**: Docker (`node:24-alpine`), Docker Compose.

---

## 👥 3. Аутентификация и безопасность

- **Пользователи по умолчанию**:
  - `timur` (Пароль: `timur`) — роль Администратор (видит секретные цели, имеет кнопку «Настройки плана»).
  - `lera` (Пароль: `lera`) — пользователь.
- **Шифрование**: PBKDF2-SHA512 (10 000 итераций, 16-байтная соль).
- **Сессии**: Хранятся в таблице `sessions` базы данных на 30 дней.
- **Поддержка заголовков**: Бэкенд и фронтенд поддерживают как `Cookie: session_token`, так и `Authorization: Bearer <token>` (хранится в `localStorage` под ключом `finance_auth_token`), что критично для надежной работы внутри Android WebView.

---

## 💰 4. Финансовая архитектура приложения

1. **Двухфазный денежный поток**:
   - **Фаза 1 (Аванс)**: `tAdv` (Тимур) + `lAdv` (Лера) + `extraAdv`.
   - **Фаза 2 (Зарплата)**: `tSal` (Тимур) + `lSal` (Лера) + `extraSal`.
2. **Обязательные платежи**:
   - ЖКУ (Коммуналка `comm`) списывается в 1-й фазе (Аванс).
   - Аренда (`rent`) списывается во 2-й фазе (Зарплата).
3. **Кредитная карта**:
   - Погашается в 1-ю очередь в заданной фазе (`advance` или `salary`), пока флаг `isPaid` не станет `true`.
4. **Накопительные цели (Goals)**:
   - Суммарный ежемесячный взнос по целям вычитается из доходов.
   - Распределение нагрузки между авансом и зарплатой динамическое (по коэффициентам чистых потоков `rAdv` / `rSal`).
   - Поддержка секретных целей (`isSecret: true`), видимых только Тимуру.
5. **4 Свободных фонда (в процентах от остатка)**:
   - `groc` — Продукты (по умолчанию ~55%).
   - `wants` — Хотелки / Желания (по умолчанию ~20%).
   - `unplan` — Внеплановые расходы (по умолчанию ~10%).
   - `save` — Подушка безопасности / Сбережения (по умолчанию ~15%).
6. **Шаблоны и перенос остатков**:
   - Продукты с флагом `pinned: true` автоматически создаются как шаблон в новых месяцах.
   - Модальное окно `RollOverModal` позволяет переносить сэкономленные остатки фондов в следующий месяц или переводить их в цели/подушку.

---

## 📱 5. Мобильное приложение (Android APK & Capacitor)

- **Конфигурация Capacitor ([capacitor.config.ts](file:///D:/PYTHON_PROJECTS/finanses/capacitor.config.ts))**:
  - `androidScheme: 'http'`, `cleartext: true`, `allowNavigation: ['*']`.
- **Разрешения Android ([AndroidManifest.xml](file:///D:/PYTHON_PROJECTS/finanses/android/app/src/main/AndroidManifest.xml))**:
  - `android:usesCleartextTraffic="true"`, `INTERNET`.
  - `android:networkSecurityConfig="@xml/network_security_config"` — разрешает HTTP-трафик к IP сервера.
- **Подключение к серверу из APK ([src/lib/api.ts](file:///D:/PYTHON_PROJECTS/finanses/src/lib/api.ts))**:
  - При запуске внутри Android APK (`localhost` / `capacitor://`) `getApiBaseUrl()` автоматически возвращает `http://94.154.11.219:3000`.
  - Возможность ручной смены и проверки URL сервера на экранах входа (`LoginModal.tsx`) и профиля (`UserProfileModal.tsx`) через `localStorage.finance_api_url`.
- **Иконки и экраны загрузки**:
  - Сгенерированы из [public/favicon.jpg](file:///D:/PYTHON_PROJECTS/finanses/public/favicon.jpg) для всех плотностей `mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`, круглые маски `ic_launcher_round.png`, адаптивные `ic_launcher_foreground.png` и заставки `splash.png`.

---

## 🚢 6. Сервер и деплой (Docker)

- **Dockerfile**:
  - Двухэтапный билд на базе `node:24-alpine`.
  - Этап сборщика компилирует React-клиент через Vite в `/app/dist`.
  - Этап рантайма ставит только легковесный пакет `express` (SQLite встроен в Node 24).
  - Настроены увеличенные таймауты `fetch-retry` для предотвращения сетевых сбоев `ETIMEDOUT`.
- **Docker Compose ([docker-compose.yml](file:///D:/PYTHON_PROJECTS/finanses/docker-compose.yml))**:
  - Порт: `3000:3000`.
  - Persistent Volume: `./data:/app/data` (база `finance.db` сохраняется на хосте).
- **Команды на VPS**:
  ```bash
  cd ~/finanses
  git pull
  docker compose up -d --build
  ```

---

## 💻 7. Основные команды проекта

```bash
# Локальная разработка (одновременный запуск сервера API и Vite)
npm run dev

# Сборка веб-приложения
npm run build

# Синхронизация веб-билда с Android
npm run cap:sync

# Открытие проекта в Android Studio
npm run cap:open

# Запуск чистого бэкенда
node server.js
```

---

## 🔧 8. Решенные проблемы и важные правила верстки

1. **Типографика чисел и валюты**:
   - **Запрещено** использовать `@number-flow/react` для отображения отрицательных сумм и знака `₽` (вызывает наслоение символов в WebView).
   - Все числа форматируются через утилиту `formatCurrency(val)` из [src/lib/calculations.ts](file:///D:/PYTHON_PROJECTS/finanses/src/lib/calculations.ts) и компонент [src/components/corr/animated-number.tsx](file:///D:/PYTHON_PROJECTS/finanses/src/components/corr/animated-number.tsx).
   - Всегда используется Unicode минус (`−\u00A0`) и неразрывный пробел перед знаком рубля (`\u00A0₽`).
2. **Таблицы на мобильных экранах**:
   - **Запрещено** задавать таблицам `table-fixed` без минимальной ширины.
   - В [data-table.tsx](file:///D:/PYTHON_PROJECTS/finanses/src/components/corr/data-table.tsx) используется `w-full min-w-[520px] table-auto` с горизонтальным скроллом `scrollbar-none`.
   - Плавающая колонка действий (3 точки) имеет полупрозрачный фон `bg-card/95 backdrop-blur-sm border-l`, чтобы не накладываться поверх текста.
3. **Безопасные отступы Safe Areas**:
   - В [src/index.css](file:///D:/PYTHON_PROJECTS/finanses/src/index.css) прописаны `env(safe-area-inset-top)` и `env(safe-area-inset-bottom)` под вырезы камер и панель жестов Android.
4. **Удаленный мусор**:
   - Папка `finanses/` (старый кэш Next.js на 465 МБ) и устаревший файл `public/index.html` полностью удалены.
