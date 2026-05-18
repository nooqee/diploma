'use client';

import './globals.css';
import { useAppStore } from '@/stores/useAppStore';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { CustomCursor } from '@/components/layout/CustomCursor';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAppStore();

    return (
        <html lang="ru" className="dark">
            <body className="min-h-screen bg-[#0a0a0f] text-foreground font-sans antialiased relative">
                {/* Aurora background orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="aurora-orb aurora-orb-purple w-[600px] h-[600px] -top-40 -left-40" />
                    <div className="aurora-orb aurora-orb-cyan w-[500px] h-[500px] top-1/3 -right-40" style={{ animationDelay: '2s' }} />
                    <div className="aurora-orb aurora-orb-pink w-[400px] h-[400px] bottom-20 left-1/4" style={{ animationDelay: '4s' }} />
                </div>

                <CustomCursor />
                <div className="relative z-10 flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 w-full">
                        {children}
                    </main>
                    <Navigation />
                </div>
            </body>
        </html>
    );
}
