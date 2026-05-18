/**
 * MOCK DATA - Моковые данные для демонстрации интерфейса
 * Используются для тестирования фронтенда без подключения реального бэкенда
 */

import { User, SearchPreferences, ParsedJob, BaseResume, AIGeneratedArtifacts } from '@/types';

/**
 * Моковый пользователь
 */
export const mockUser: User = {
    id: 'user_1',
    name: 'Алексей Иванов',
    email: 'alexey.ivanov@example.com',
    phone: '+7 (999) 123-45-67',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Ivanov&background=4F46E5&color=fff',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * Моковые параметры поиска
 */
export const mockSearchPreferences: SearchPreferences = {
    grade: 'Middle',
    minSalary: 100000,
    maxSalary: 250000,
    location: 'Москва',
    techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    remoteOnly: false,
    experienceYears: 3,
    updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * Моковое базовое резюме
 */
export const mockBaseResume: BaseResume = {
    id: 'resume_1',
    userId: 'user_1',
    content: `
    ИМЯ: Алексей Иванов
    ДОЛЖНОСТЬ: Frontend Developer (Middle)
    
    SKILLS:
    - React, TypeScript, Next.js
    - Tailwind CSS, Shadcn UI
    - Redux, Zustand
    - Jest, React Testing Library
    - Git, GitHub
    
    ОПЫТ:
    - 3 года коммерческой разработки
    - 2 проекта в команде
    - Участие в open source
    
    ОБРАЗОВАНИЕ:
    - Высшее техническое образование
    - Курсы Frontend-разработки
  `,
    fileName: 'resume_alexey.pdf',
    fileType: 'pdf',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Zustand', 'Git'],
    experience: [
        'Frontend Developer в IT-компании (2022-н.в.)',
        'Junior Developer в стартапе (2020-2022)',
    ],
    education: [
        'Высшее техническое образование (2016-2020)',
        'Курсы Frontend-разработки (2021)',
    ],
    summary: 'Мотивированный Frontend-разработчик с опытом коммерческой разработки. Увлечён созданием современных и отзывчивых веб-приложений.',
    uploadedAt: '2024-01-15T10:00:00Z',
};

/**
 * Моковые вакансии (умная лента)
 */
export const mockJobs: ParsedJob[] = [
    {
        id: 'job_1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        companyId: 'company_1',
        location: 'Москва',
        salaryMin: 250000,
        salaryMax: 400000,
        salaryCurrency: 'RUB',
        employmentType: 'Full-time',
        vacancyType: 'Senior',
        description: `
      Мы ищем Senior Frontend Developer для работы над нашими флагманскими продуктами.
      
      В ваши обязанности войдёт:
      - Архитектура и разработка клиентской части
      - Менторство Junior и Middle разработчиков
      - Участие в code review
      
      Требования:
      - 5+ лет опыта в Frontend
      - Глубокое знание React, TypeScript
      - Опыт работы с микросервисной архитектурой
      - Английский язык B2+
    `,
        requirements: [
            '5+ лет опыта в Frontend разработке',
            'Глубокое знание React, TypeScript, Next.js',
            'Опыт работы с Tailwind CSS или аналогами',
            'Знание state management (Redux, Zustand)',
            'Английский язык B2+',
        ],
        responsibilities: [
            'Архитектура клиентской части приложения',
            'Разработка новых фич',
            'Менторство младших разработчиков',
            'Code review и качество кода',
        ],
        benefits: [
            'Дистанционная работа',
            'Оплачиваемое обучение',
            'ДМС',
            'Гибкий график',
        ],
        source: 'hh.ru',
        postedAt: '2024-01-10T08:00:00Z',
        tags: ['React', 'TypeScript', 'Next.js', 'Remote'],
        relevanceScore: 92,
        matchedSkills: ['React', 'TypeScript', 'Next.js', 'Zustand'],
        skillMatchPercentage: 85,
        parsingMetadata: {
            parsedAt: '2024-01-15T10:00:00Z',
            confidenceScore: 0.95,
            sourceUrl: 'https://hh.ru/vacancy/12345',
        },
    },
    {
        id: 'job_2',
        title: 'Middle Frontend Developer',
        company: 'Habr Career',
        companyId: 'company_2',
        location: 'Удалённо',
        salaryMin: 180000,
        salaryMax: 300000,
        salaryCurrency: 'RUB',
        employmentType: 'Full-time',
        vacancyType: 'Middle',
        description: `
      Ищем Middle Frontend Developer в нашу команду.
      
      Что делать:
      - Разработка интерфейсов на React
      - Интеграция с бэкенд API
      - Оптимизация производительности
      
      Ждём от вас:
      - 3+ года опыта
      - React, TypeScript
      - Git, GitHub
    `,
        requirements: [
            '3+ года опыта в Frontend',
            'React, TypeScript',
            'Git, GitHub',
            'REST API',
        ],
        responsibilities: [
            'Разработка интерфейсов',
            'Интеграция с API',
            'Оптимизация производительности',
        ],
        benefits: [
            'Удалённая работа',
            'Оплачиваемые курсы',
            'Техническое оборудование',
        ],
        source: 'habr',
        postedAt: '2024-01-12T09:00:00Z',
        tags: ['React', 'TypeScript', 'Remote', 'Habr'],
        relevanceScore: 88,
        matchedSkills: ['React', 'TypeScript', 'Git'],
        skillMatchPercentage: 80,
        parsingMetadata: {
            parsedAt: '2024-01-15T10:00:00Z',
            confidenceScore: 0.92,
            sourceUrl: 'https://habr.com/vacancy/67890',
        },
    },
    {
        id: 'job_3',
        title: 'Junior Frontend Developer',
        company: 'StartUp Inc',
        companyId: 'company_3',
        location: 'Санкт-Петербург',
        salaryMin: 80000,
        salaryMax: 150000,
        salaryCurrency: 'RUB',
        employmentType: 'Full-time',
        vacancyType: 'Junior',
        description: `
      Молодая команда ищет Junior Frontend Developer.
      
      Обязанности:
      - Разработка UI компонентов
      - Тестирование
      - Документация
      
      Требования:
      - Знание HTML, CSS, JS
      - Базовый React
      - Готовность учиться
    `,
        requirements: [
            'Знание HTML, CSS, JavaScript',
            'Базовый React',
            'Готовность учиться',
        ],
        responsibilities: [
            'Разработка UI компонентов',
            'Тестирование',
            'Документация',
        ],
        benefits: [
            'Менторство',
            'Обучение',
            'Командовые мероприятия',
        ],
        source: 'avito',
        postedAt: '2024-01-14T11:00:00Z',
        tags: ['React', 'Junior', 'Avito'],
        relevanceScore: 65,
        matchedSkills: ['React'],
        skillMatchPercentage: 50,
        parsingMetadata: {
            parsedAt: '2024-01-15T10:00:00Z',
            confidenceScore: 0.85,
            sourceUrl: 'https://avito.ru/vacancy/11111',
        },
    },
    {
        id: 'job_4',
        title: 'Frontend Developer (React)',
        company: 'Digital Agency',
        companyId: 'company_4',
        location: 'Москва',
        salaryMin: 150000,
        salaryMax: 280000,
        salaryCurrency: 'RUB',
        employmentType: 'Full-time',
        vacancyType: 'Middle',
        description: `
      Digital Agency ищет Frontend Developer для работы с клиентами.
      
      Что предлагаем:
      - Интересные проекты
      - Команда профессионалов
      - Рост и развитие
    `,
        requirements: [
            'React, TypeScript',
            'HTML5, CSS3',
            'REST API',
            'Git',
        ],
        responsibilities: [
            'Разработка сайтов для клиентов',
            'Работа с API',
            'Оптимизация',
        ],
        benefits: [
            'Интересные проекты',
            'Команда',
            'Рост',
        ],
        source: 'hh.ru',
        postedAt: '2024-01-13T10:00:00Z',
        tags: ['React', 'TypeScript', 'Agency'],
        relevanceScore: 78,
        matchedSkills: ['React', 'TypeScript', 'Git'],
        skillMatchPercentage: 70,
        parsingMetadata: {
            parsedAt: '2024-01-15T10:00:00Z',
            confidenceScore: 0.88,
            sourceUrl: 'https://hh.ru/vacancy/22222',
        },
    },
    {
        id: 'job_5',
        title: 'Senior React Developer',
        company: 'FinTech Solutions',
        companyId: 'company_5',
        location: 'Удалённо',
        salaryMin: 300000,
        salaryMax: 500000,
        salaryCurrency: 'RUB',
        employmentType: 'Full-time',
        vacancyType: 'Senior',
        description: `
      FinTech компания ищет Senior React Developer.
      
      Обязанности:
      - Разработка банковских приложений
      - Высоконагруженные системы
      - Безопасность
      
      Требования:
      - 5+ лет опыта
      - React, TypeScript
      - Финтех опыт - плюс
    `,
        requirements: [
            '5+ лет опыта',
            'React, TypeScript',
            'Финтех опыт - плюс',
            'Безопасность',
        ],
        responsibilities: [
            'Разработка банковских приложений',
            'Работа с высоконагруженными системами',
            'Обеспечение безопасности',
        ],
        benefits: [
            'Высокая оплата',
            'Удалёнка',
            'ДМС',
        ],
        source: 'hh.ru',
        postedAt: '2024-01-11T09:00:00Z',
        tags: ['React', 'TypeScript', 'FinTech', 'Remote'],
        relevanceScore: 85,
        matchedSkills: ['React', 'TypeScript'],
        skillMatchPercentage: 75,
        parsingMetadata: {
            parsedAt: '2024-01-15T10:00:00Z',
            confidenceScore: 0.90,
            sourceUrl: 'https://hh.ru/vacancy/33333',
        },
    },
];

/**
 * Моковые сгенерированные артефакты ИИ
 */
export const mockGeneratedArtifacts: AIGeneratedArtifacts = {
    id: 'artifacts_1',
    vacancyId: 'job_1',
    vacancyTitle: 'Senior Frontend Developer',
    originalResumeId: 'resume_1',
    generatedAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    resume: {
        content: `
      АЛЕКСЕЙ ИВАНОВ
      Senior Frontend Developer
      
      ПРОФИЛЬ
      Мотивированный Senior Frontend Developer с 5+ лет коммерческого опыта. 
      Специализируюсь на создании масштабируемых и высокопроизводительных веб-приложений 
      с использованием современных технологий React, TypeScript и Next.js.
      
      КЛЮЧЕВЫЕ НАВЫКИ (Hard Skills):
      - React, Next.js, TypeScript (5 лет)
      - State Management: Redux, Zustand, Context API
      - Стилизация: Tailwind CSS, Shadcn UI, CSS Modules
      - Тестирование: Jest, React Testing Library, Cypress
      - Архитектура: Микросервисы, Monorepo, Code Splitting
      - DevOps: CI/CD, Docker, GitHub Actions
      
      ОПЫТ РАБОТЫ:
      
      Senior Frontend Developer | TechCorp (2022-н.в.)
      - Архитектура и разработка клиентской части enterprise-приложений
      - Менторство Junior и Middle разработчиков
      - Внедрение best practices и code review
      - Улучшение производительности на 40%
      
      Middle Frontend Developer | Startup Inc (2020-2022)
      - Разработка React-приложений с нуля
      - Интеграция с REST API и GraphQL
      - Участие в дизайне UI/UX
      
      ОБРАЗОВАНИЕ:
      - Высшее техническое образование (2016-2020)
      - Курсы Advanced React Patterns (2021)
      - FinTech Security for Frontend (2023)
      
      ДОСТИЖЕНИЯ:
      - Разработка библиотеки компонентов, используемой в 3 продуктах
      - Оптимизация рендеринга, снижение LCP на 35%
      - Open source: 20+ pull requests в популярные репозитории
    `,
        fileName: 'resume_for_techcorp.pdf',
        format: 'pdf',
        highlightedSkills: [
            'React',
            'TypeScript',
            'Next.js',
            'Redux',
            'Zustand',
            'Tailwind CSS',
            'Shadcn UI',
            'Jest',
            'React Testing Library',
            'CI/CD',
            'Docker',
        ],
        improvements: [
            'Добавьте конкретные метрики влияния (например, "улучшение производительности на 40%")',
            'Укажите участие в open source проектах',
            'Добавьте раздел с сертификатами и курсами',
            'Уточните стек технологий для каждого проекта',
        ],
    },
    coverLetter: {
        content: `
      Уважаемая команда TechCorp!
      
      Меня зовут Алексей Иванов, и я с большим интересом откликаюсь на вакансию 
      Senior Frontend Developer. Мой опыт и навыки идеально соответствуют требованиям 
      вашей компании.
      
      За последние 5 лет я разработал и поддерживал несколько enterprise-приложений 
      на React и Next.js. Мой последний проект — платформа для управления контентом 
      с более чем 100K ежедневных пользователей.
      
      Почему я подойду для вашей команды:
      - Глубокое знание React экосистемы и TypeScript
      - Опыт работы с микросервисной архитектурой
      - Навыки менторства и code review
      - Английский язык B2+ (могу работать с международной командой)
      - Готовность к удалённой работе и гибкому графику
      
      Я внимательно изучил вашу компанию и впечатлён вашими продуктами. 
      Буду рад возможности обсудить, как мой опыт может помочь достичь ваших целей.
      
      Спасибо за рассмотрение моей кандидатуры!
      
      С уважением,
      Алексей Иванов
      +7 (999) 123-45-67
      alexey.ivanov@example.com
    `,
        tone: 'enthusiastic',
        atsOptimized: true,
    },
    metadata: {
        tokensUsed: 2450,
        generationTimeMs: 3200,
        modelVersion: 'deepseek-v2.5',
    },
};

/**
 * Моковые данные для профиля
 */
export const mockProfileData = {
    user: mockUser,
    preferences: mockSearchPreferences,
    baseResume: mockBaseResume,
};

/**
 * Утилитарные функции для работы с моковыми данными
 */
export const mockDataUtils = {
    /**
     * Фильтрация вакансий по минимальному скору релевантности
     */
    filterByRelevance: (jobs: ParsedJob[], minScore: number): ParsedJob[] => {
        return jobs.filter((job) => job.relevanceScore >= minScore);
    },

    /**
     * Сортировка вакансий по дате публикации
     */
    sortByDate: (jobs: ParsedJob[]): ParsedJob[] => {
        return [...jobs].sort(
            (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
    },

    /**
     * Группировка вакансий по источнику
     */
    groupBySource: (jobs: ParsedJob[]): Record<string, ParsedJob[]> => {
        return jobs.reduce(
            (acc, job) => {
                const source = job.source as string;
                if (!acc[source]) {
                    acc[source] = [];
                }
                acc[source].push(job);
                return acc;
            },
            {} as Record<string, ParsedJob[]>
        );
    },

    /**
     * Поиск вакансий по ключевому слову
     */
    searchByKeyword: (jobs: ParsedJob[], keyword: string): ParsedJob[] => {
        if (!keyword) return jobs;
        const lowerKeyword = keyword.toLowerCase();
        return jobs.filter(
            (job) =>
                job.title.toLowerCase().includes(lowerKeyword) ||
                job.company.toLowerCase().includes(lowerKeyword) ||
                job.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))
        );
    },
};
