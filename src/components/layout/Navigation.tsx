"use client";

export function Navigation() {
    return (
        <footer className="mt-auto border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto px-4 py-5 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} AI Job Assistant — Умный поиск работы
            </div>
        </footer>
    );
}
