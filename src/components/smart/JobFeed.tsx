'use client';

import { useState, useEffect } from 'react';
import { JobCard } from '@/components/smart/JobCard';
import { JobFilters } from '@/components/smart/JobFilters';
import { ParsedJob, JobFilters as JobFiltersType } from '@/types';
import { cn } from '@/lib/utils';

interface JobFeedProps {
    jobs: ParsedJob[];
    filters: JobFiltersType;
    onFilterChange: (filters: JobFiltersType) => void;
    onJobClick: (job: ParsedJob) => void;
}

export function JobFeed({ jobs, filters, onFilterChange, onJobClick }: JobFeedProps) {
    const [filteredJobs, setFilteredJobs] = useState<ParsedJob[]>(jobs);

    // Sync filtered jobs when jobs prop changes
    useEffect(() => {
        setFilteredJobs(jobs);
    }, [jobs]);

    // Apply filters
    useEffect(() => {
        let result = [...jobs];

        if (filters.minRelevanceScore !== undefined) {
            result = result.filter((job) => job.relevanceScore >= filters.minRelevanceScore!);
        }

        if (filters.source && filters.source !== 'all') {
            result = result.filter((job) => job.source === filters.source);
        }

        if (filters.remoteOnly) {
            result = result.filter((job) => job.location.includes('Удалённо'));
        }

        setFilteredJobs(result);
    }, [jobs, filters]);

    return (
        <div className="space-y-6">
            {/* Job Filters */}
            <JobFilters filters={filters} onFilterChange={onFilterChange} />

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Найдено вакансий: <span className="font-semibold text-foreground">{filteredJobs.length}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    Средний скор: <span className="font-semibold text-foreground">
                        {Math.round(
                            filteredJobs.length
                                ? filteredJobs.reduce((sum, job) => sum + job.relevanceScore, 0) / filteredJobs.length
                                : 0
                        )}%
                    </span>
                </p>
            </div>

            {/* Job Cards Grid */}
            {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onClick={onJobClick}
                            onCopyLink={() => {
                                if (job.parsingMetadata.sourceUrl) {
                                    navigator.clipboard.writeText(job.parsingMetadata.sourceUrl);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className={cn(
                    "rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center",
                    "glass-card"
                )}>
                    <p className="text-lg text-muted-foreground">
                        Вакансий по выбранным фильтрам не найдено
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Попробуйте изменить параметры фильтрации
                    </p>
                </div>
            )}

            {/* Sort by relevance indicator */}
            <div className={cn(
                "rounded-xl border border-white/10 bg-white/[0.02] p-4",
                "glass-card"
            )}>
                <p className="text-sm text-muted-foreground">
                    <span className="text-violet-400 font-medium">Подсказка:</span> Вакансии отсортированы по скору релевантности (от высшего к низшему).
                    Чем выше скор, тем больше совпадений между вашим резюме и требованиями вакансии.
                </p>
            </div>
        </div>
    );
}
