// ============================================================================
// TYPE DEFINITIONS - Основные TypeScript интерфейсы для дипломного проекта
// ============================================================================

/**
 * Базовый профиль пользователя
 */
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Параметры поиска (сохраняются в JSONB на бэкенде)
 */
export interface SearchPreferences {
    grade: 'Junior' | 'Middle' | 'Senior';
    minSalary: number;
    maxSalary: number;
    location: string;
    techStack: string[];
    remoteOnly?: boolean;
    experienceYears?: number;
    updatedAt: string;
}

/**
 * Исходное резюме пользователя (базовое)
 */
export interface BaseResume {
    id: string;
    userId: string;
    content: string; // Текст резюме или base64 encoded файл
    fileName?: string;
    fileType: 'pdf' | 'docx' | 'text';
    skills: string[];
    experience: string[];
    education: string[];
    summary?: string;
    uploadedAt: string;
}

/**
 * Сущность вакансии (сырые данные из парсера)
 */
export interface Vacancy {
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

/**
 * Парсированная вакансия с метаданными и скорингом
 */
export interface ParsedJob extends Vacancy {
    relevanceScore: number; // Скор релевантности от ML-модуля (0-100%)
    matchedSkills: string[]; // Найдённые совпадения hard skills
    skillMatchPercentage: number; // Процент совпадения навыков
    aiRecommendation?: string; // Рекомендация от ИИ (опционально)
    parsingMetadata: {
        parsedAt: string;
        confidenceScore: number;
        sourceUrl?: string;
    };
}

/**
 * Результат генерации ИИ (резюме + сопроводительное письмо)
 */
export interface AIGeneratedArtifacts {
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
        highlightedSkills: string[]; // Hard skills, выделенные ИИ
        improvements: string[]; // Рекомендации по улучшению
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

/**
 * Фильтры для умной ленты
 */
export interface JobFilters {
    minRelevanceScore?: number;
    maxDate?: string;
    source?: 'hh.ru' | 'habr' | 'avito' | 'all';
    employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
    remoteOnly?: boolean;
}

/**
 * Состояние приложения (Zustand store)
 */
export interface AppState {
    user: User | null;
    searchPreferences: SearchPreferences;
    baseResume: BaseResume | null;
    jobs: ParsedJob[];
    selectedJob?: ParsedJob;
    generatedArtifacts: AIGeneratedArtifacts | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * API Response типы
 */
export interface ApiResponse<T> {
    data: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
    error?: {
        code: string;
        message: string;
    };
}

/**
 * Типы для форм (React Hook Form)
 */
export interface FormValues {
    name: string;
    email: string;
    phone?: string;
    grade: 'Junior' | 'Middle' | 'Senior';
    minSalary: number;
    maxSalary: number;
    location: string;
    techStack: string[];
    resumeContent: string;
    resumeFile?: File;
}

/**
 * Типы для компонентов UI
 */
export interface JobCardProps {
    job: ParsedJob;
    onClick: (job: ParsedJob) => void;
    onCopyLink?: (job: ParsedJob) => void;
}

export interface JobFeedProps {
    jobs: ParsedJob[];
    filters: JobFilters;
    onFilterChange: (filters: JobFilters) => void;
    onJobClick: (job: ParsedJob) => void;
}

export interface SmartApplyProps {
    job: ParsedJob;
    onGenerate: () => Promise<void>;
    onCopy: () => void;
    onDownload: () => void;
}

export interface ProfileFormProps {
    user: User;
    preferences: SearchPreferences;
    baseResume: BaseResume | null;
    onSavePreferences: (prefs: SearchPreferences) => void;
    onSaveResume: (resume: BaseResume) => void;
}
