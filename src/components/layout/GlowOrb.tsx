'use client';

import { useEffect, useRef } from 'react';

export function GlowOrb() {
    const orbRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const orb = orbRef.current;
        if (!orb) return;

        const onMove = (e: MouseEvent) => {
            const rect = orb.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / 30;
            const dy = (e.clientY - cy) / 30;
            orb.style.transform = `translate(${dx}px, ${dy}px)`;
        };

        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80" ref={orbRef} style={{ transition: 'transform 0.3s ease-out' }}>
            {/* Outer glow */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
                    filter: 'blur(40px)',
                    transform: 'scale(1.5)',
                }}
            />
            {/* Main orb body */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle at 30% 30%, #1a1a2e 0%, #0a0a0f 60%, #000 100%)',
                    boxShadow: `
                        inset -20px -20px 60px rgba(0,0,0,0.8),
                        inset 10px 10px 40px rgba(139,92,246,0.1),
                        0 0 60px rgba(139,92,246,0.2),
                        0 0 120px rgba(236,72,153,0.1)
                    `,
                }}
            />
            {/* Crescent glow (the bright edge) */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.03) 60deg, rgba(192,132,252,0.2) 120deg, rgba(255,255,255,0.6) 170deg, rgba(255,255,255,0.8) 180deg, rgba(255,255,255,0.6) 190deg, rgba(192,132,252,0.2) 240deg, rgba(255,255,255,0.03) 300deg, transparent 360deg)',
                    filter: 'blur(8px)',
                    mixBlendMode: 'screen',
                }}
            />
            {/* Sharp crescent line */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'conic-gradient(from 175deg at 50% 50%, transparent 0deg, transparent 150deg, rgba(255,255,255,0.9) 175deg, rgba(255,255,255,1) 180deg, rgba(255,255,255,0.9) 185deg, transparent 210deg, transparent 360deg)',
                    filter: 'blur(2px)',
                }}
            />
            {/* Inner dark core */}
            <div
                className="absolute inset-4 rounded-full"
                style={{
                    background: 'radial-gradient(circle at 40% 40%, #0f0f1a 0%, #050507 100%)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
                }}
            />
        </div>
    );
}
