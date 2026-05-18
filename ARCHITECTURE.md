# Архитектура фронтенд-приложения

## 📁 Структура директорий

```
test/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (profile)/               # Маршрут: Профиль и настройки
│   │   │   ├── page.tsx             # Экран "Настройки поиска и Профиль"
│   │   │   ├── profile-form/        # Компоненты формы профиля
│   │   │   │   ├── ProfileHeader.tsx
│   │   │   │   ├── SearchPreferencesForm.tsx
│   │   │   │   └── BaseResumeUploader.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (jobs)/                  # Маршрут: Умная лента вакансий
│   │   │   ├── page.tsx             # Экран "Умная лента вакансий"
│   │   │   ├── job-feed/            # Компоненты ленты
│   │   │   │   ├── JobFeed.tsx
│   │   │   │   ├── JobCard.tsx
│   │   │   │   └── JobFilters.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (smart-apply)/           # Маршрут: Интеллектуальный отклик
│   │   │   ├── [jobId]/             # Динамический маршрут по ID вакансии
│   │   │   │   ├── page.tsx         # Экран "Интеллектуальный отклик"
│   │   │   │   ├── SmartApplyLayout.tsx
│   │   │   │   ├── VacancyReader.tsx
│   │   │   │   └── AIGenerationPanel.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── layout.tsx               # Корневой layout
│   │   └── globals.css              # Глобальные стили (Tailwind)
│   │
│   ├── components/                  # Переиспользуемые компоненты
│   │   ├── ui/                      # Dumb UI компоненты (Shadcn UI)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── smart/                   # Smart компоненты с бизнес-логикой
│   │   │   ├── JobFeed.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobFilters.tsx
│   │   │   ├── SmartApplyLayout.tsx
│   │   │   ├── VacancyReader.tsx
│   │   │   └── AIGenerationPanel.tsx
│   │   │
│   │   └── layout/                  # Компоненты макета
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Navigation.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useJobs.ts               # Логика работы с вакансиями
│   │   ├── useSearchPreferences.ts  # Управление настройками поиска
│   │   └── useAIGeneration.ts       # Логика генерации ИИ
│   │
│   ├── lib/                        # Утилитарный код
│   │   ├── mockData.ts              # Моковые данные
│   │   ├── api.ts                   # API клиенты
│   │   └── utils.ts                 # Утилитарные функции
│   │
│   ├── stores/                      # Zustand stores
│   │   └── useAppStore.ts           # Глобальное состояние
│   │
│   ├── types/                       # TypeScript типы
│   │   └── index.ts                 # Все типы данных
│   │
│   └── styles/                     # Дополнительные стили
│       └── globals.css
│
├── public/                         # Статические файлы
│   ├── images/
│   └── fonts/
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 📦 Основные TypeScript-интерфейсы

### 1. User — Профиль пользователя

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Назначение:** Хранит информацию о пользователе (имя, контакты, аватар).

---

### 2. SearchPreferences — Параметры поиска

```typescript
interface SearchPreferences {
  grade: 'Junior' | 'Middle' | 'Senior';
  minSalary: number;
  maxSalary: number;
  location: string;
  techStack: string[];
  remoteOnly?: boolean;
  experienceYears?: number;
  updatedAt: string;
}
```

**Назначение:** Настройки фильтрации вакансий (грейд, зарплата, локация, стек).

---

### 3. Vacancy — Сырая вакансия из парсера

```typescript
interface Vacancy {
  id: string;
  title: string;
  company: string;
  companyId: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: 'RUB' | 'USD' | 'EUR';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  vacancyType: 'Junior' | 'Middle' | 'Senior' | 'Internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  source: 'hh.ru' | 'habr' | 'avito';
  postedAt: string;
  deadline?: string;
  isUrgent?: boolean;
  tags: string[];
}
```

**Назначение:** Базовая информация о вакансии от источника.

---

### 4. ParsedJob — Парсированная вакансия с ML-метаданными

```typescript
interface ParsedJob extends Vacancy {
  relevanceScore: number;           // Скор релевантности (0-100%)
  matchedSkills: string[];          // Совпавшие hard skills
  skillMatchPercentage: number;     // Процент совпадения
  aiRecommendation?: string;        // Рекомендация ИИ
  parsingMetadata: {
    parsedAt: string;
    confidenceScore: number;
    sourceUrl?: string;
  };
}
```

**Назначение:** Вакансия с результатами ML-скоринга и метаданными парсинга.

---

### 5. BaseResume — Базовое резюме пользователя

```typescript
interface BaseResume {
  id: string;
  userId: string;
  content: string;                  // Текст или base64 файл
  fileName?: string;
  fileType: 'pdf' | 'docx' | 'text';
  skills: string[];
  experience: string[];
  education: string[];
  summary?: string;
  uploadedAt: string;
}
```

**Назначение:** Исходное резюме пользователя для адаптации.

---

### 6. AIGeneratedArtifacts — Результат генерации ИИ

```typescript
interface AIGeneratedArtifacts {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  originalResumeId?: string;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  
  resume: {
    content: string;
    fileName: string;
    format: 'pdf' | 'docx';
    highlightedSkills: string[];    // Hard skills, выделенные ИИ
    improvements: string[];         // Рекомендации по улучшению
  };
  
  coverLetter: {
    content: string;
    tone: 'formal' | 'casual' | 'enthusiastic';
    atsOptimized: boolean;
  };
  
  metadata: {
    tokensUsed: number;
    generationTimeMs: number;
    modelVersion: string;
  };
}
```

**Назначение:** Сгенерированное резюме и сопроводительное письмо с метаданными.

---

### 7. JobFilters — Фильтры для умной ленты

```typescript
interface JobFilters {
  minRelevanceScore?: number;       // Минимальный скор релевантности
  maxDate?: string;                 // Максимальная дата публикации
  source?: 'hh.ru' | 'habr' | 'avito' | 'all';
  employmentType?: string;
  remoteOnly?: boolean;
}
```

**Назначение:** Клиентские фильтры для сортировки вакансий.

---

### 8. AppState — Состояние приложения (Zustand)

```typescript
interface AppState {
  user: User | null;
  searchPreferences: SearchPreferences;
  baseResume: BaseResume | null;
  jobs: ParsedJob[];
  selectedJob?: ParsedJob;
  generatedArtifacts: AIGeneratedArtifacts | null;
  isLoading: boolean;
  error: string | null;
}
```

**Назначение:** Глобальное состояние приложения.

---

## 🏗️ Архитектурные принципы

### 1. Component-Driven Development

- **Dumb компоненты:** Чистые UI элементы без бизнес-логики (Button, Card, Input)
- **Smart компоненты:** Компоненты с бизнес-логикой (JobFeed, JobCard, SmartApplyLayout)
- **Container компоненты:** Координируют smart компоненты (страницы)

### 2. Separation of Concerns

- UI логика в компонентах
- Бизнес-логика в hooks
- API взаимодействия в lib/api.ts
- Моковые данные в lib/mockData.ts

### 3. Mobile-First Design

- Адаптивная верстка через Tailwind CSS
- Mobile-first breakpoints
- Touch-friendly элементы

### 4. TypeScript Strict Mode

- Строгая типизация всех данных
- Нет `any` типов
- Индексные типы для коллекций

---

## 📡 API взаимодействия

### Бэкенд endpoints (RESTful):

```
GET    /api/jobs              # Получить список вакансий
GET    /api/jobs/:id          # Получить вакансию по ID
POST   /api/jobs/generate     # Сгенерировать резюме (LLM)
GET    /api/user              # Получить профиль пользователя
PUT    /api/user/preferences  # Обновить настройки поиска
POST   /api/user/resume       # Загрузить резюме
```

---

## 🎨 UI/UX принципы

1. **Минимализм:** Чистый дизайн, акцент на контенте
2. **Отзывчивость:** Мгновенная обратная связь (лоадеры, скелетоны)
3. **Доступность:** WCAG 2.1 AA compliance
4. **Консистентность:** Единый дизайн-система (Shadcn UI)

---

## 🚀 Следующие шаги

1. **Шаг 2:** Реализовать экран "Профиль и настройки" с формами
2. **Шаг 3:** Реализовать экран "Умная лента" с моковыми данными
3. **Шаг 4:** Реализовать экран "Интеллектуальный отклик" со split-экраном
