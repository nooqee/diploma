'use client';

import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: -100, y: -100 });
    const ringPos = useRef({ x: -100, y: -100 });
    const [visible, setVisible] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [clicking, setClicking] = useState(false);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            pos.current.x = e.clientX;
            pos.current.y = e.clientY;
            if (!visible) setVisible(true);
        };

        const onLeave = () => {
            setVisible(false);
        };

        const onEnter = () => setVisible(true);

        const onDown = () => setClicking(true);
        const onUp = () => setClicking(false);

        // Detect hover over interactive elements
        const onOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor-hover]');
            setHovering(!!isInteractive);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseover', onOver);
        document.body.addEventListener('mouseleave', onLeave);
        document.body.addEventListener('mouseenter', onEnter);
        window.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);

        let raf: number;
        const animate = () => {
            const lerp = hovering ? 0.18 : 0.12;
            ringPos.current.x += (pos.current.x - ringPos.current.x) * lerp;
            ringPos.current.y += (pos.current.y - ringPos.current.y) * lerp;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
            }
            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
            }

            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOver);
            document.body.removeEventListener('mouseleave', onLeave);
            document.body.removeEventListener('mouseenter', onEnter);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup', onUp);
            cancelAnimationFrame(raf);
        };
    }, [hovering, visible]);

    if (typeof window === 'undefined') return null;

    return (
        <>
            {/* Кольцо — плавно следует за курсором */}
            <div
                ref={ringRef}
                className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block transition-[width,height,opacity,border-color] duration-200"
                style={{
                    width: clicking ? 32 : hovering ? 52 : 44,
                    height: clicking ? 32 : hovering ? 52 : 44,
                    borderRadius: '50%',
                    border: hovering
                        ? '1.5px solid rgba(139, 92, 246, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.25)',
                    background: hovering
                        ? 'rgba(139, 92, 246, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: hovering
                        ? '0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 10px rgba(139, 92, 246, 0.1)'
                        : 'none',
                    opacity: visible ? 1 : 0,
                    willChange: 'transform',
                }}
            />
            {/* Точка — точно под курсором */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
                style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: hovering ? 'rgba(139, 92, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    boxShadow: hovering
                        ? '0 0 8px rgba(139, 92, 246, 0.6)'
                        : '0 0 6px rgba(255, 255, 255, 0.4)',
                    opacity: visible ? 1 : 0,
                    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.15s',
                    willChange: 'transform',
                }}
            />
        </>
    );
}
