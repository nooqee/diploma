'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, SearchPreferences, BaseResume } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileFormProps {
    user: User;
    preferences: SearchPreferences;
    baseResume: BaseResume | null;
    onSavePreferences: (prefs: SearchPreferences) => void;
    onSaveResume: (resume: BaseResume) => void;
}

export function ProfileForm({ user, preferences: initialPreferences, baseResume: initialBaseResume, onSavePreferences, onSaveResume }: ProfileFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'preferences' | 'resume'>('preferences');

    const [preferences, setPreferences] = useState<SearchPreferences>(initialPreferences || {
        grade: 'Middle',
        minSalary: 100000,
        maxSalary: 250000,
        location: 'Москва',
        techStack: [],
        remoteOnly: false,
        updatedAt: new Date().toISOString(),
    });

    const [baseResume, setBaseResume] = useState<BaseResume | null>(initialBaseResume);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const handleSavePreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`${API}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            onSavePreferences(preferences);
        } catch (err) {
            console.error('Save preferences failed', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveResume = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const body = { base_resume: baseResume };
            const res = await fetch(`${API}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            if (baseResume) onSaveResume(baseResume);
        } catch (err) {
            console.error('Save resume failed', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* User Info */}
            <div className={cn("rounded-xl border border-white/10 bg-white/[0.02] p-6", "glass-card")}>
                <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-foreground text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={activeTab === 'preferences' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('preferences')}
                    className={activeTab === 'preferences'
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow'
                        : 'text-foreground/80 hover:text-foreground hover:bg-white/5'
                    }
                >
                    Параметры поиска
                </Button>
                <Button
                    variant={activeTab === 'resume' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('resume')}
                    className={activeTab === 'resume'
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow'
                        : 'text-foreground/80 hover:text-foreground hover:bg-white/5'
                    }
                >
                    Резюме
                </Button>
            </div>

            {activeTab === 'preferences' && (
                <Card className="bg-white/[0.02] border-white/[0.06] glass-card">
                    <CardHeader>
                        <CardTitle className="text-foreground">Настройки поиска</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Настройте критерии для поиска вакансий
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSavePreferences} className="space-y-4">
                            {/* Грейд */}
                            <div className="space-y-2">
                                <Label htmlFor="grade" className="text-foreground">Желаемый грейд</Label>
                                <select
                                    id="grade"
                                    value={preferences.grade}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, grade: e.target.value as 'Junior' | 'Middle' | 'Senior' })
                                    }
                                    className={cn(
                                        "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none",
                                        "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    )}
                                >
                                    <option value="Junior">Junior</option>
                                    <option value="Middle">Middle</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>

                            {/* Зарплатная вилка */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minSalary" className="text-foreground">Мин. зарплата (₽)</Label>
                                    <Input
                                        id="minSalary"
                                        type="number"
                                        value={preferences.minSalary}
                                        onChange={(e) =>
                                            setPreferences({ ...preferences, minSalary: Number(e.target.value) })
                                        }
                                        className="bg-white/5 border-white/10 text-foreground focus:border-violet-500/50 focus:ring-violet-500/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxSalary" className="text-foreground">Макс. зарплата (₽)</Label>
                                    <Input
                                        id="maxSalary"
                                        type="number"
                                        value={preferences.maxSalary}
                                        onChange={(e) =>
                                            setPreferences({ ...preferences, maxSalary: Number(e.target.value) })
                                        }
                                        className="bg-white/5 border-white/10 text-foreground focus:border-violet-500/50 focus:ring-violet-500/30"
                                    />
                                </div>
                            </div>

                            {/* Локация */}
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-foreground">Локация</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    value={preferences.location}
                                    onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                                    placeholder="Москва, Удалённо и т.д."
                                    className="bg-white/5 border-white/10 text-foreground focus:border-violet-500/50 focus:ring-violet-500/30"
                                />
                            </div>

                            {/* Стек технологий */}
                            <div className="space-y-2">
                                <Label htmlFor="techStack" className="text-foreground">Стек технологий (через запятую)</Label>
                                <Input
                                    id="techStack"
                                    type="text"
                                    value={preferences.techStack.join(', ')}
                                    onChange={(e) =>
                                        setPreferences({
                                            ...preferences,
                                            techStack: e.target.value.split(',').map((s) => s.trim()),
                                        })
                                    }
                                    placeholder="React, TypeScript, Node.js"
                                    className="bg-white/5 border-white/10 text-foreground focus:border-violet-500/50 focus:ring-violet-500/30"
                                />
                            </div>

                            {/* Remote only */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="remoteOnly"
                                    checked={preferences.remoteOnly || false}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, remoteOnly: e.target.checked })
                                    }
                                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 accent-violet-500 focus:ring-violet-500/30"
                                />
                                <Label htmlFor="remoteOnly" className="text-sm text-foreground cursor-pointer font-normal">
                                    Только удалённая работа
                                </Label>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSavePreferences} disabled={isSaving}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow"
                        >
                            {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {activeTab === 'resume' && (
                <Card className="bg-white/[0.02] border-white/[0.06] glass-card">
                    <CardHeader>
                        <CardTitle className="text-foreground">Резюме</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Загрузите ваше базовое резюме. ИИ будет использовать его для генерации адаптированных версий.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveResume} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="resumeContent" className="text-foreground">Текст резюме</Label>
                                <textarea
                                    id="resumeContent"
                                    value={baseResume?.content || ''}
                                    onChange={(e) =>
                                        setBaseResume({
                                            ...baseResume,
                                            id: baseResume?.id || '',
                                            userId: baseResume?.userId || '',
                                            fileType: baseResume?.fileType || 'text',
                                            skills: baseResume?.skills || [],
                                            experience: baseResume?.experience || [],
                                            education: baseResume?.education || [],
                                            uploadedAt: baseResume?.uploadedAt || new Date().toISOString(),
                                            content: e.target.value,
                                        })
                                    }
                                    className={cn(
                                        "flex min-h-[200px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground",
                                        "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    )}
                                    placeholder="Ваше резюме..."
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    id="resumeFile"
                                    accept=".pdf,.docx,.txt"
                                    className="flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-violet-400 hover:bg-white/[0.07]"
                                />
                            </div>

                            {baseResume && (
                                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                                    <p className="text-sm font-medium text-foreground">Предпросмотр резюме:</p>
                                    <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{baseResume.content}</pre>
                                </div>
                            )}
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveResume} disabled={!baseResume || isSaving}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-glow"
                        >
                            {isSaving ? 'Сохранение...' : 'Сохранить резюме'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
