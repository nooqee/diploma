"use client";

import { useEffect, useState } from 'react';
import { ProfileForm } from '@/components/smart/ProfileForm';
import { User, SearchPreferences, BaseResume } from '@/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [preferences, setPreferences] = useState<SearchPreferences | null>(null);
    const [baseResume, setBaseResume] = useState<BaseResume | null>(null);
    const [loading, setLoading] = useState(true);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    useEffect(() => {
        const id = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
        if (!id) {
            window.location.href = '/';
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API}/users/${id}`);
                if (!res.ok) throw new Error('failed to fetch user');
                const u = await res.json();
                if (cancelled) return;
                setUser(u);
                setPreferences((u.preferences as SearchPreferences) ?? null);
                setBaseResume((u.base_resume as BaseResume) ?? null);
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const onSavePreferences = (prefs: SearchPreferences) => {
        setPreferences(prefs);
    };

    const onSaveResume = (resume: BaseResume) => {
        setBaseResume(resume);
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-12">
                <div className="glass-card p-8 text-center">
                    <div className="text-muted-foreground">Загрузка профиля...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-12">
                <div className="glass-card p-8 text-center">
                    <div className="text-muted-foreground">Пользователь не найден</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    <span className="gradient-text">Профиль</span>
                </h1>
                <p className="text-muted-foreground mt-1">Управляйте параметрами поиска и резюме</p>
            </div>

            <ProfileForm
                user={user}
                preferences={preferences as SearchPreferences}
                baseResume={baseResume}
                onSavePreferences={onSavePreferences}
                onSaveResume={onSaveResume}
            />
        </div>
    );
}
