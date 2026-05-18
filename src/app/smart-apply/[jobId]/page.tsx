'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VacancyReader } from '@/components/smart/VacancyReader';
import { AIGenerationPanel } from '@/components/smart/AIGenerationPanel';
import { ParsedJob, AIGeneratedArtifacts } from '@/types';
import { cn } from '@/lib/utils';

interface SmartApplyPageProps {
    params: { jobId: string };
}

export default function SmartApplyPage({ params }: SmartApplyPageProps) {
    const { jobId } = params;
    const [selectedJob, setSelectedJob] = useState<ParsedJob | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [artifacts, setArtifacts] = useState<AIGeneratedArtifacts | undefined>(undefined);
    const [loadingJob, setLoadingJob] = useState(true);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API}/jobs`);
                if (!res.ok) throw new Error(`status ${res.status}`);
                const data = await res.json();
                const mapped = (data as any[]).map((p) => ({
                    id: String(p.id || p.raw_job_id || Math.random()),
                    title: p.title || 'No title',
                    company: p.company || '',
                    companyId: '',
                    location: p.location || '',
                    salaryMin: p.salary_min || 0,
                    salaryMax: p.salary_max || 0,
                    salaryCurrency: 'RUB' as const,
                    employmentType: 'Full-time' as const,
                    vacancyType: 'Middle' as const,
                    description: p.ai_recommendation || '',
                    requirements: p.hard_skills || [],
                    responsibilities: [],
                    benefits: [],
                    source: p.source || 'hh.ru',
                    postedAt: p.posted_at || new Date().toISOString(),
                    deadline: undefined,
                    isUrgent: false,
                    tags: [],
                    relevanceScore: typeof p.relevance_score === 'number' ? Math.round(p.relevance_score) : p.relevance_score || 0,
                    matchedSkills: p.matched_skills || [],
                    skillMatchPercentage: 0,
                    aiRecommendation: p.ai_recommendation || undefined,
                    parsingMetadata: {
                        parsedAt: new Date().toISOString(),
                        confidenceScore: 1,
                        sourceUrl: p.source_url || p.raw_url || undefined,
                    },
                }));
                if (cancelled) return;
                const found = (mapped as ParsedJob[]).find((j) => j.id === jobId);
                setSelectedJob(found);
            } catch (err) {
                console.error('Failed to fetch job', err);
            } finally {
                if (!cancelled) setLoadingJob(false);
            }
        })();
        return () => { cancelled = true; };
    }, [jobId]);

    const handleGenerate = async () => {
        if (!selectedJob) return;
        setIsGenerating(true);
        try {
            const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
            const res = await fetch(`${API}/smart-apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId || '', job_id: selectedJob.id }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const data = await res.json();
            // Adapt backend response to AIGeneratedArtifacts shape
            const adapted: AIGeneratedArtifacts = {
                id: data.id || `artifacts_${selectedJob.id}`,
                vacancyId: selectedJob.id,
                vacancyTitle: selectedJob.title,
                originalResumeId: data.original_resume_id,
                generatedAt: data.generated_at || new Date().toISOString(),
                status: data.status || 'completed',
                resume: {
                    content: data.resume?.content || data.cover_letter || '',
                    fileName: data.resume?.file_name || 'resume.pdf',
                    format: data.resume?.format || 'pdf',
                    highlightedSkills: data.resume?.highlighted_skills || data.highlighted_skills || [],
                    improvements: data.resume?.improvements || [],
                },
                coverLetter: {
                    content: data.cover_letter?.content || data.cover_letter || '',
                    tone: data.cover_letter?.tone || 'formal',
                    atsOptimized: data.cover_letter?.ats_optimized ?? true,
                },
                metadata: {
                    tokensUsed: data.metadata?.tokens_used || 0,
                    generationTimeMs: data.metadata?.generation_time_ms || 3000,
                    modelVersion: data.metadata?.model_version || 'deepseek-v2.5',
                },
            };
            setArtifacts(adapted);
        } catch (err) {
            console.error('Smart apply failed', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (artifacts?.coverLetter) {
            navigator.clipboard.writeText(artifacts.coverLetter.content);
        }
    };

    const handleDownload = () => {
        if (artifacts?.resume) {
            console.log('Скачивание файла:', artifacts.resume.fileName);
        }
    };

    if (loadingJob) {
        return (
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="glass-card p-8 text-center">
                    <div className="text-muted-foreground">Загрузка вакансии...</div>
                </div>
            </div>
        );
    }

    if (!selectedJob) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-12">
                <div className="glass-card p-8 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Вакансия не найдена</h1>
                    <p className="text-muted-foreground mt-2">
                        Вакансия с ID {jobId} не существует
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="gradient-text">Интеллектуальный отклик</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Адаптация резюме под вакансию с помощью ИИ
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/10">{selectedJob.source}</Badge>
                    <Button variant="outline" size="sm" asChild className="border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                        <a href="/jobs">Назад к вакансиям</a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)] min-h-[500px]">
                <div className="lg:col-span-1 h-full">
                    <VacancyReader job={selectedJob} />
                </div>

                <div className="lg:col-span-1 h-full">
                    <AIGenerationPanel
                        vacancyTitle={selectedJob.title}
                        onGenerate={handleGenerate}
                        onCopy={handleCopy}
                        onDownload={handleDownload}
                        artifacts={artifacts}
                        isGenerating={isGenerating}
                    />
                </div>
            </div>
        </div>
    );
}
