'use client';

import { useEffect, useState } from 'react';
import { JobFeed } from '@/components/smart/JobFeed';
import { ParsedJob, JobFilters } from '@/types';
import { cn } from '@/lib/utils';

export default function JobFeedPage() {
    const [jobs, setJobs] = useState<ParsedJob[]>([]);
    const [filters, setFilters] = useState<JobFilters>({
        minRelevanceScore: undefined,
        source: 'all',
        remoteOnly: false,
    });
    const [query, setQuery] = useState('');
    const [parsing, setParsing] = useState(false);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${API}/jobs`);
            if (!res.ok) throw new Error(`API returned ${res.status}`);
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
            setJobs(mapped as ParsedJob[]);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await fetchJobs();
        })();
        return () => { cancelled = true; };
    }, []);

    const handleParse = async () => {
        if (!query.trim()) return;
        setParsing(true);
        try {
            const res = await fetch(`${API}/jobs/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, sources: ['hh.ru', 'habr', 'avito'] }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            await fetchJobs();
        } catch (err) {
            console.error('Parse failed', err);
        } finally {
            setParsing(false);
        }
    };

    const handleJobClick = (job: ParsedJob) => {
        window.location.href = `/smart-apply/${job.id}`;
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            {/* Search section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    <span className="gradient-text">Умная лента вакансий</span>
                </h1>
                <p className="text-muted-foreground mb-6">
                    Вакансии, отфильтрованные и отсортированные по вашему профилю и навыкам
                </p>

                <div className={cn(
                    "glass-card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center",
                    "glow-hover transition-all duration-300"
                )}>
                    <input
                        className="flex-1 h-11 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                        placeholder="Введите запрос для поиска вакансий..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                    />
                    <button
                        onClick={handleParse}
                        disabled={parsing}
                        className={cn(
                            "h-11 px-6 rounded-lg font-medium text-sm text-white whitespace-nowrap",
                            "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                            "hover:from-violet-500 hover:to-fuchsia-500",
                            "shadow-glow transition-all duration-300",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {parsing ? 'Поиск...' : 'Найти вакансии'}
                    </button>
                </div>
            </div>

            <JobFeed
                jobs={jobs}
                filters={filters}
                onFilterChange={setFilters}
                onJobClick={handleJobClick}
            />
        </div>
    );
}
