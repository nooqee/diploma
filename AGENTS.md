# AGENTS.md — Job Search AI Assistant

Файл для AI-агентов, работающих с проектом. Вся документация, комментарии в коде и UI-тексты написаны на русском языке.

---

## Обзор проекта

Дипломный проект — программный ассистент для автоматизированного поиска вакансий и интеллектуального улучшения резюме на базе ИИ.

Архитектура — микросервисная, полностью контейнеризована через Docker Compose:

- **Фронтенд** — Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand. Порт 3000.
- **API** — Go 1.23 (Fiber) + PostgreSQL (pgx/v5). Порт 8080.
- **Парсер** — Go-сервис, собирает вакансии с hh.ru, Habr Career и публикует в Kafka. Порт 8081.
- **ML Scorer** — Python 3.11, слушает Kafka, считает релевантность через эмбеддинги и пишет в БД.
- **Инфраструктура** — PostgreSQL 15+ с pgvector, Kafka + Zookeeper.

Пользовательский сценарий:

1. Регистрация на лендинге (`/`)
2. Настройка профиля и загрузка резюме (`/profile`)
3. Просмотр умной ленты вакансий (`/jobs`)
4. Интеллектуальный отклик — генерация адаптированного резюме и сопроводительного письма (`/smart-apply/[jobId]`)

---

## Технологический стек

### Фронтенд

- **Next.js 14.2.0** (App Router, клиентские компоненты с `'use client'`)
- **React 18.3**, **TypeScript 5.3** (strict mode)
- **Tailwind CSS 3.4** + **tailwindcss-animate**
- **Shadcn UI** — компоненты на базе Radix UI (`button`, `card`, `dialog`, `input`, `badge`, `skeleton` и др.)
- **Zustand 4.5** — глобальное состояние
- **Lucide React** + **Radix Icons** — иконки
- **clsx + tailwind-merge** — утилита `cn()` для условных классов

### Бэкенд (API + Парсер)

- **Go 1.23**
- **Fiber v2** — веб-фреймворк
- **pgx/v5** — драйвер PostgreSQL с пулом соединений
- **segmentio/kafka-go** — Kafka client
- **goquery** — HTML-парсинг для вакансий
- **bcrypt** — хеширование паролей
- **godotenv** — загрузка `.env`

### ML Scorer

- **Python 3.11**
- **kafka-python** — consumer
- **psycopg2-binary** — PostgreSQL
- **sentence-transformers** + **torch** — локальные эмбеддинги (модель `all-MiniLM-L6-v2`)
- Фолбэк: pseudo-embedding через SHA256

### База данных

- **PostgreSQL** с расширением **pgvector**
- Векторная размерность: **384** (под `all-MiniLM-L6-v2`)
- Таблицы: `users_metadata`, `raw_jobs`, `processed_jobs`, `kafka_offsets`
- Функция `upsert_processed_job(...)` для атомарного обновления скоринга

---

## Структура директорий

```
backend/
  go.mod, go.sum          # Go-модуль job-search-assistant
  main.go                 # API-сервер (Fiber)
  openapi.yaml            # Спецификация OpenAPI 3.0
  Dockerfile              # Сборка API
  internal/
    db/db.go              # Пул соединений pgxpool
    handlers/handlers.go  # HTTP-хендлеры
    models/models.go      # Go-структуры
  parser/
    main.go               # Сервис парсинга (worker pool + Kafka producer)
    sources/sources.go    # Парсеры hh.ru / Habr / generic (goquery)
    Dockerfile            # Сборка парсера

ml_scorer/
  scorer.py               # Kafka consumer + ML-скоринг
  requirements.txt        # Python-зависимости
  Dockerfile

src/
  app/                    # Next.js App Router
    layout.tsx            # Корневой layout (Header + Navigation)
    page.tsx              # Лендинг / регистрация
    profile/page.tsx      # Профиль и настройки
    jobs/page.tsx         # Умная лента вакансий
    smart-apply/[jobId]/page.tsx  # Интеллектуальный отклик
  components/
    ui/                   # Dumb UI (Shadcn UI)
    smart/                # Smart-компоненты (JobFeed, JobCard, ProfileForm, ...)
    layout/               # Header, Navigation
  lib/
    mockData.ts           # Моковые данные для демо
    utils.ts              # cn() — merge Tailwind классов
  stores/
    useAppStore.ts        # Zustand store
  types/
    index.ts              # TypeScript интерфейсы

sql/
  init.sql                # Инициализация БД (таблицы, индексы, функции)

docker-compose.yml          # Все сервисы
scripts/
  setup-windows.ps1       # Установка зависимостей (winget)
  setup-python-venv.ps1   # Создание venv для ml_scorer
  start-stack.ps1         # Запуск docker-compose + проверка health
```

---

## Команды сборки и запуска

### Фронтенд (локально)

```bash
npm install
npm run dev      # localhost:3000
npm run build    # продакшен-сборка
npm start        # запуск собранного приложения
npm run lint     # линтинг
```

### Полный стек (Docker Compose)

```bash
# Windows (PowerShell)
.\scripts\start-stack.ps1

# Или вручную
docker-compose up --build -d
```

Сервисы после `docker-compose up`:

- PostgreSQL: `localhost:5432`
- Kafka: `localhost:9092`
- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`

### ML Scorer (локально, без Docker)

```bash
.\scripts\setup-python-venv.ps1
cd ml_scorer
. .\.venv\Scripts\Activate.ps1   # Windows
python scorer.py
```

### Переменные окружения

Пример в `.env.example`:

```
DATABASE_URL=postgres://app:changeme@postgres:5432/jobsdb?sslmode=disable
API_PORT=8080
KAFKA_BROKERS=kafka:9092
OPENAI_API_KEY=               # опционально для OpenAI-эмбеддингов
DEEPSEEK_URL=http://deepseek:8000
```

Фронтенд использует `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:8080`).

---

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check |
| POST | `/users` | Регистрация (с bcrypt-хешем пароля) |
| GET | `/users/:id` | Получить профиль |
| PUT | `/users/:id` | Обновить preferences / base_resume |
| DELETE | `/users/:id` | Удалить пользователя |
| GET | `/jobs?min_score=&source=` | Лента вакансий (сортировка по relevance_score DESC) |
| POST | `/smart-apply` | Синхронная генерация через DeepSeek API |
| GET | `/docs` | Swagger UI (CDN) |
| GET | `/openapi.yaml` | Спецификация |

---

## Соглашения по коду

### Язык

- **Комментарии и документация** — русский.
- **Код (переменные, функции, типы)** — английский.
- **UI-тексты** — русский.

### TypeScript / React

- **Strict mode** включён. Не используйте `any` без крайней необходимости.
- **App Router** Next.js — страницы по умолчанию Server Components, но в проекте почти все помечены `'use client'` из-за использования hooks и Zustand.
- **Path alias**: `@/` → `./src/`. Импортируйте через `@/components/ui/button`, `@/types` и т.д.
- **Dumb / Smart / Container** разделение:
  - `components/ui/*` — чистые UI-компоненты без бизнес-логики.
  - `components/smart/*` — компоненты с бизнес-логикой и состоянием.
  - `app/*/page.tsx` — страницы-контейнеры.
- **Стилизация** — исключительно Tailwind CSS. Утилита `cn(...)` из `src/lib/utils.ts` для условных классов.
- **Моковые данные** — `src/lib/mockData.ts`. Используются для демонстрации UI без бэкенда.

### Go

- Модуль: `job-search-assistant`.
- Код в `backend/internal/`: `db`, `handlers`, `models`.
- Graceful shutdown через `signal.Notify` + `app.ShutdownWithContext`.
- SQL-запросы с таймаутами через `context.WithTimeout`.
- Парсер использует worker pool с exponential backoff и ротацией HTTP-прокси.

### Python

- ML Scorer читает переменные окружения через `os.getenv` с дефолтами.
- Поддерживаются три режима эмбеддингов: `local` (sentence-transformers), `openai`, `pseudo` (фолбэк).

---

## Тестирование

В проекте **нет формального тестового набора** (unit / integration / e2e тесты отсутствуют).

Стратегия тестирования:

1. **Моковые данные** (`src/lib/mockData.ts`) — позволяют проверить UI без запущенного бэкенда.
2. **Ручное тестирование через Docker Compose** — скрипт `scripts/start-stack.ps1` поднимает весь стек и проверяет `/health`.
3. **Swagger UI** (`http://localhost:8080/docs`) — для ручного тестирования API.

Если вы добавляете тесты:

- Фронтенд: используйте **Jest** + **React Testing Library** (уже знакомы по стеку в mockData).
- Go: стандартный `testing` + `testify`.
- Python: `pytest`.

---

## Безопасность

- Пароли хешируются через **bcrypt** (`bcrypt.DefaultCost`).
- Базовая защита от stored XSS: входные строки санитизируются (`regexp.ReplaceAllString(<[^>]*>, "")`).
- CORS настроен только для `http://localhost:3000` (разработка).
- **Нет JWT / сессионной аутентификации** — `user_id` хранится в `localStorage`. Это упрощённая схема для диплома.
- PostgreSQL-пароль в Docker Compose захардкожен (`changeme`) — только для локальной разработки.

---

## Важные нюансы для агентов

1. **Пользовательский ID**: фронтенд хранит `user_id` в `localStorage` после регистрации. Все запросы к `/users/:id` используют этот ID.
2. **JobFeed**: фронтенд делает `fetch(`${API}/jobs`)` и маппит ответ API на `ParsedJob`. API возвращает поля `relevance_score`, `matched_skills`, `hard_skills`, `ai_recommendation`, а фронтенд дополняет недостающие поля дефолтами.
3. **SmartApply**: страница `/smart-apply/[jobId]` в текущей версии использует моковые данные (`mockJobs`, `mockGeneratedArtifacts`) и имитирует задержку генерации через `setTimeout(3000)`.
4. **Kafka-топики**: `raw_jobs_topic` (парсер → ML scorer) и `scored_jobs_topic` (опционально). Топики создаются через `kafka-init` контейнер при старте Docker Compose.
5. **Parser seeds**: парсер получает начальные URL через переменную `JOB_SEEDS` в формате `source:source_id:url|source:source_id:url`. Без seeds парсер просто ждёт.
6. **Vector dimension**: в `sql/init.sql` задано `vector(384)` под модель `all-MiniLM-L6-v2`. Если меняете модель — обновите размерность и `EMBEDDING_DIM` в `docker-compose.yml`.
7. **DeepSeek**: эндпоинт `/smart-apply` проксирует запрос на `DEEPSEEK_URL` (по умолчанию `http://deepseek:8000/generate`). В текущем `docker-compose.yml` сервис DeepSeek **не описан** — ожидается внешний сервис или mock.

---

## Полезные ссылки внутри проекта

- `ARCHITECTURE.md` — подробное описание фронтенд-архитектуры, TypeScript-интерфейсов и UI/UX принципов.
- `README.md` — краткое описание проекта, установка, технологии.
- `backend/openapi.yaml` — полная спецификация REST API.
- `sql/init.sql` — схема БД, индексы, хранимая функция `upsert_processed_job`.
