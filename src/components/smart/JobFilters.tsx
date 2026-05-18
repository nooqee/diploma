'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobFilters as JobFiltersType } from '@/types';
import { cn } from '@/lib/utils';

interface JobFiltersProps {
    filters: JobFiltersType;
    onFilterChange: (filters: JobFiltersType) => void;
}

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
    const [localFilters, setLocalFilters] = useState<JobFiltersType>(filters);

    const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? undefined : Number(e.target.value);
        setLocalFilters({ ...localFilters, minRelevanceScore: value });
        onFilterChange({ ...localFilters, minRelevanceScore: value });
    };

    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocalFilters({ ...localFilters, source: e.target.value as JobFiltersType['source'] });
        onFilterChange({ ...localFilters, source: e.target.value as JobFiltersType['source'] });
    };

    const handleRemoteOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalFilters({ ...localFilters, remoteOnly: e.target.checked });
        onFilterChange({ ...localFilters, remoteOnly: e.target.checked });
    };

    const resetFilters = () => {
        const reset: JobFiltersType = {
            minRelevanceScore: undefined,
            source: 'all',
            remoteOnly: false,
        };
        setLocalFilters(reset);
        onFilterChange(reset);
    };

    return (
        <Card className="bg-white/[0.02] border-white/[0.06] glass-card">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg text-foreground">Фильтры</CardTitle>
                <CardDescription className="text-muted-foreground">Настройте параметры фильтрации вакансий</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {/* Минимальный скор релевантности */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                            Минимальный скор релевантности
                            <Badge variant="secondary" className="text-xs bg-white/5">
                                {localFilters.minRelevanceScore || 0}%
                            </Badge>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={localFilters.minRelevanceScore || 0}
                            onChange={handleMinScoreChange}
                            className="w-full accent-violet-500"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Любые</span>
                            <span>60%+</span>
                            <span>75%+</span>
                            <span>90%+</span>
                        </div>
                    </div>

                    {/* Источник вакансии */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Источник</label>
                        <select
                            value={localFilters.source || 'all'}
                            onChange={handleSourceChange}
                            className={cn(
                                "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none",
                                "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                            )}
                        >
                            <option value="all">Все площадки</option>
                            <option value="hh.ru">hh.ru</option>
                            <option value="habr">Habr Career</option>
                            <option value="avito">Avito</option>
                        </select>
                    </div>

                    {/* Только удалённая работа */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="remoteOnly"
                            checked={localFilters.remoteOnly || false}
                            onChange={handleRemoteOnlyChange}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 accent-violet-500 focus:ring-violet-500/30"
                        />
                        <label htmlFor="remoteOnly" className="text-sm text-foreground cursor-pointer">
                            Только удалённая работа
                        </label>
                    </div>

                    {/* Кнопка сброса */}
                    <Button variant="outline" size="sm" onClick={resetFilters} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:text-foreground">
                        Сбросить фильтры
                    </Button>

                    {/* Активные фильтры */}
                    {(localFilters.minRelevanceScore || localFilters.source !== 'all' || localFilters.remoteOnly) && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-muted-foreground">Активные:</span>
                            {localFilters.minRelevanceScore ? (
                                <Badge variant="secondary" className="text-xs bg-white/5">
                                    Мин. скор: {localFilters.minRelevanceScore}%
                                </Badge>
                            ) : null}
                            {localFilters.source !== 'all' && (
                                <Badge variant="secondary" className="text-xs bg-white/5">
                                    {localFilters.source}
                                </Badge>
                            )}
                            {localFilters.remoteOnly && (
                                <Badge variant="secondary" className="text-xs bg-white/5">
                                    Удалённо
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
