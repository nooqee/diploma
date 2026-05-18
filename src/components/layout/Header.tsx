'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
    const { user, setUser } = useAppStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => setUser(null);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-white/5 transition-all duration-300',
                scrolled
                    ? 'bg-black/40 backdrop-blur-xl'
                    : 'bg-black/20 backdrop-blur-md'
            )}
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <a href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-glow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold gradient-text">AI Job Assistant</span>
                </a>

                <div className="flex items-center gap-1">
                    <nav className="hidden sm:flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild className="text-foreground/80 hover:text-foreground hover:bg-white/5">
                            <a href="/jobs">Вакансии</a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="text-foreground/80 hover:text-foreground hover:bg-white/5">
                            <a href="/profile">Профиль</a>
                        </Button>
                    </nav>

                    {user && (
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground/80 hover:text-foreground hover:bg-white/5 ml-2">
                            Выйти
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
