'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';

export function SmartApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setSelectedJob, setGeneratedArtifacts } = useAppStore();

    const handleBack = () => {
        setSelectedJob(undefined);
        setGeneratedArtifacts(null);
    };

    return (
        <div className="min-h-full">
            <div className="container mx-auto max-w-6xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight gradient-text">Интеллектуальный отклик</h1>
                        <p className="text-muted-foreground mt-1">
                            Адаптация резюме под вакансию с помощью ИИ
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleBack} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                        Назад к вакансиям
                    </Button>
                </div>
                {children}
            </div>
        </div>
    );
}
