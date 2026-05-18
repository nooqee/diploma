'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParsedJob } from '@/types';
import { cn } from '@/lib/utils';

interface VacancyReaderProps {
    job: ParsedJob;
}

export function VacancyReader({ job }: VacancyReaderProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(job.description);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            <Card className={cn("h-full flex flex-col bg-white/[0.02] border-white/[0.06] glass-card")}>
                <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <CardTitle className="text-xl text-foreground">{job.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 text-muted-foreground flex-wrap">
                                <span className="font-medium text-foreground/80">{job.company}</span>
                                <span className="text-white/20">•</span>
                                <span>{job.location}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="border-white/10">{job.source}</Badge>
                            <Badge variant={job.relevanceScore >= 90 ? 'success' : 'default'}>
                                {job.relevanceScore}%
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                        <h3 className="text-base font-semibold mb-2 text-foreground">О вакансии</h3>
                        <p className="whitespace-pre-wrap text-sm text-foreground/80">{job.description}</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {job.requirements.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-foreground">Требования:</h4>
                                <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                                    {job.requirements.map((req, idx) => (
                                        <li key={idx}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {job.responsibilities.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-foreground">Ответственность:</h4>
                                <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                                    {job.responsibilities.map((resp, idx) => (
                                        <li key={idx}>{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {job.benefits.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-foreground">Бенефиты:</h4>
                                <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                                    {job.benefits.map((benefit, idx) => (
                                        <li key={idx}>{benefit}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs text-muted-foreground">
                            Источник:{" "}
                            {job.parsingMetadata.sourceUrl ? (
                                <a
                                    href={job.parsingMetadata.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-violet-400 hover:text-violet-300 underline underline-offset-2 ml-1 transition-colors"
                                >
                                    Открыть ссылку →
                                </a>
                            ) : (
                                <span className="ml-1">—</span>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                            {isCopied ? 'Скопировано!' : 'Копировать текст'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
