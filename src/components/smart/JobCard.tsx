'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ParsedJob } from '@/types';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface JobCardProps {
    job: ParsedJob;
    onClick: (job: ParsedJob) => void;
    onCopyLink?: (job: ParsedJob) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
    const [flipped, setFlipped] = useState(false);

    const formatSalary = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getRelevanceLevel = (score: number) => {
        if (score >= 90) return { label: 'Отлично', variant: 'success' as const };
        if (score >= 75) return { label: 'Хорошо', variant: 'info' as const };
        if (score >= 60) return { label: 'Умеренно', variant: 'warning' as const };
        return { label: 'Низкий', variant: 'destructive' as const };
    };

    const relevance = getRelevanceLevel(job.relevanceScore);

    const hasSalary = job.salaryMin > 0 || job.salaryMax > 0;

    const handleBackClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = job.parsingMetadata.sourceUrl;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            onClick(job);
        }
    };

    return (
        <div
            className="group relative h-[380px]"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
        >
            {/* Inner flip container */}
            <div
                className={cn(
                    "relative w-full h-full transition-transform duration-700 ease-out",
                    "preserve-3d"
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* FRONT SIDE */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-xl p-5 flex flex-col",
                        "bg-white/[0.02] border border-white/[0.06]",
                        "transition-all duration-300",
                        "group-hover:border-violet-500/20 group-hover:shadow-glow"
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Header */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground line-clamp-1">{job.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground/70">{job.company || 'Компания не указана'}</span>
                            {job.location && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span>{job.location}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant={relevance.variant}>{relevance.label}</Badge>
                        <Badge variant="outline" className="border-white/10">{job.source}</Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3 overflow-hidden">
                        {/* Зарплата */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Зарплата:</span>
                            <span className="text-sm font-semibold text-foreground">
                                {hasSalary
                                    ? `${formatSalary(job.salaryMin)} — ${formatSalary(job.salaryMax)}`
                                    : 'Зарплата не указана'
                                }
                            </span>
                        </div>

                        {/* Скор релевантности */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Релевантность:</span>
                                <span className="text-sm font-medium">{job.relevanceScore}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${Math.max(job.relevanceScore, 5)}%`,
                                        background: job.relevanceScore >= 90
                                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                                            : job.relevanceScore >= 75
                                                ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                                                : job.relevanceScore >= 60
                                                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                                    : 'linear-gradient(90deg, #f87171, #ef4444)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Совпавшие навыки */}
                        {job.matchedSkills.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Навыки:</span>
                                <div className="flex flex-wrap gap-1">
                                    {job.matchedSkills.slice(0, 4).map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs border-white/10 text-foreground/80">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {job.matchedSkills.length > 4 && (
                                        <Badge variant="outline" className="text-xs border-white/10 text-foreground/50">
                                            +{job.matchedSkills.length - 4}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(job.postedAt).toLocaleDateString('ru-RU')}</span>
                        {job.isUrgent && (
                            <span className="text-amber-400 font-medium">Срочно</span>
                        )}
                    </div>
                </div>

                {/* BACK SIDE */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-4",
                        "bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40",
                        "border border-violet-500/30",
                        "backdrop-blur-xl",
                        "cursor-pointer hover:border-violet-400/50 hover:shadow-glow"
                    )}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                    onClick={handleBackClick}
                >
                    {/* Orb decoration */}
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl" />
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-400/30 flex items-center justify-center">
                            <ExternalLink className="w-7 h-7 text-violet-300" />
                        </div>
                    </div>

                    <div className="text-center px-4">
                        <p className="text-lg font-semibold text-foreground mb-1">
                            Перейти к вакансии
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Откроется на сайте {job.source === 'hh.ru' ? 'hh.ru' : job.source === 'habr' ? 'Хабр Карьера' : job.source}
                        </p>
                    </div>

                    {job.parsingMetadata.sourceUrl && (
                        <p className="text-xs text-violet-400/70 truncate max-w-[80%]">
                            {job.parsingMetadata.sourceUrl.replace(/^https?:\/\//, '')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
