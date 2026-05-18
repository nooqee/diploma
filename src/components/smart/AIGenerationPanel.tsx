'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AIGeneratedArtifacts } from '@/types';
import { cn } from '@/lib/utils';

interface AIGenerationPanelProps {
    vacancyTitle: string;
    onGenerate: () => Promise<void>;
    onCopy: () => void;
    onDownload: () => void;
    artifacts?: AIGeneratedArtifacts;
    isGenerating?: boolean;
}

export function AIGenerationPanel({
    vacancyTitle,
    onGenerate,
    onCopy,
    onDownload,
    artifacts,
    isGenerating = false,
}: AIGenerationPanelProps) {
    if (isGenerating) {
        return (
            <Card className="h-full flex flex-col bg-white/[0.02] border-white/[0.06] glass-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Генерация материалов</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        ИИ анализирует вакансию и адаптирует ваше резюме...
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-3/4 bg-white/10" />
                        <Skeleton className="h-4 w-1/2 bg-white/10" />
                        <Skeleton className="h-4 w-5/6 bg-white/10" />

                        <div className="mt-6 p-4 rounded-lg bg-white/[0.03] border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-8 rounded-full bg-violet-500/20 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                                    <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                                <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                                <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Генерация...</span>
                            <Badge variant="secondary" className="bg-white/5">DeepSeek v2.5</Badge>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white opacity-50">
                        Генерация...
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (!artifacts) {
        return (
            <Card className="h-full flex flex-col bg-white/[0.02] border-white/[0.06] glass-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Интеллектуальная адаптация</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        ИИ сгенерирует адаптированное резюме и сопроводительное письмо для этой вакансии
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                <path d="M12 2a10 10 0 0 1 10 10" />
                                <path d="M12 12L2.5 12.5" />
                            </svg>
                        </div>
                        <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
                            Нажмите кнопку ниже, чтобы ИИ проанализировал вакансию и подготовил персонализированные материалы
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Это займет около 3–5 секунд
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={onGenerate}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow"
                    >
                        Сгенерировать резюме под вакансию
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col bg-white/[0.02] border-white/[0.06] glass-card">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-foreground">Результат генерации</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Адаптированные материалы для: <strong className="text-foreground">{vacancyTitle}</strong>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="success">Готово</Badge>
                        <Badge variant="info">{artifacts.metadata.modelVersion}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-6">
                {/* Адаптированное резюме */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Адаптированное резюме
                            <Badge variant="outline" className="border-white/10">{artifacts.resume.format}</Badge>
                        </h3>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-foreground/80 border border-white/5">
                        {artifacts.resume.content}
                    </pre>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Hard skills:</span>
                        {artifacts.resume.highlightedSkills.map((skill, idx) => (
                            <Badge key={idx} variant="default" className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/20">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                    {artifacts.resume.improvements.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                            <span className="font-semibold">Рекомендации:</span>{' '}
                            {artifacts.resume.improvements.map((imp, idx) => (
                                <span key={idx}>
                                    {imp}{idx !== artifacts.resume.improvements.length - 1 ? '. ' : ''}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Сопроводительное письмо */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Сопроводительное письмо
                            <Badge variant={artifacts.coverLetter.atsOptimized ? 'success' : 'outline'}>
                                {artifacts.coverLetter.atsOptimized ? 'ATS-оптимизировано' : 'В работе'}
                            </Badge>
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onCopy} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                                Копировать
                            </Button>
                            <Button variant="outline" size="sm" onClick={onDownload} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                                Скачать
                            </Button>
                        </div>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-foreground/80 border border-white/5">
                        {artifacts.coverLetter.content}
                    </pre>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Тон:</span>
                        <Badge variant="secondary" className="bg-white/5">{artifacts.coverLetter.tone}</Badge>
                    </div>
                </div>

                {/* Метаданные */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                            <span>Токены:</span>
                            <span className="font-medium text-foreground">{artifacts.metadata.tokensUsed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Время генерации:</span>
                            <span className="font-medium text-foreground">
                                {(artifacts.metadata.generationTimeMs / 1000).toFixed(2)} сек
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Модель:</span>
                            <span className="font-medium text-foreground">{artifacts.metadata.modelVersion}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onGenerate}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow"
                >
                    Сгенерировать ещё раз
                </Button>
            </CardFooter>
        </Card>
    );
}
