"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlowOrb } from "@/components/layout/GlowOrb";
import { Search, FileText, Sparkles, ArrowDown, LogIn, UserPlus } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const authRef = useRef<HTMLDivElement>(null);

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);

    // Register form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [regError, setRegError] = useState<string | null>(null);
    const [regLoading, setRegLoading] = useState(false);

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Если уже залогинен — редирект на вакансии
    useEffect(() => {
        const uid = localStorage.getItem("user_id");
        if (uid) router.push("/jobs");
    }, [router]);

    const scrollToAuth = () => {
        authRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        if (!loginEmail || !loginPassword) {
            setLoginError("Email и пароль обязательны");
            return;
        }
        setLoginLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Неверный email или пароль");
            }
            const user = await res.json();
            localStorage.setItem("user_id", user.id);
            localStorage.setItem("user_name", user.name);
            router.push("/jobs");
        } catch (err: any) {
            setLoginError(err.message || "Ошибка входа");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError(null);
        if (!name || !email || !password) {
            setRegError("Имя, email и пароль обязательны");
            return;
        }
        if (password !== confirm) {
            setRegError("Пароли не совпадают");
            return;
        }
        setRegLoading(true);
        try {
            const res = await fetch(`${API}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, email, phone: phone || null, password, password_confirm: confirm,
                }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `status ${res.status}`);
            }
            const created = await res.json();
            localStorage.setItem("user_id", created.id);
            localStorage.setItem("user_name", created.name);
            router.push("/profile");
        } catch (err: any) {
            setRegError(err.message || "Ошибка регистрации");
        } finally {
            setRegLoading(false);
        }
    };

    const features = [
        {
            icon: <Search className="w-6 h-6 text-violet-400" />,
            title: "Умный поиск",
            desc: "Собираем вакансии с hh.ru, Хабр Карьеры и других источников. Анализируем соответствие вашему профилю.",
        },
        {
            icon: <FileText className="w-6 h-6 text-cyan-400" />,
            title: "Адаптация резюме",
            desc: "ИИ подстраивает ваше резюме под конкретную вакансию — выделяет релевантный опыт и навыки.",
        },
        {
            icon: <Sparkles className="w-6 h-6 text-fuchsia-400" />,
            title: "Сопроводительное письмо",
            desc: "Генерируем персонализированное сопроводительное письмо для каждой вакансии за секунды.",
        },
    ];

    return (
        <div className="flex flex-col">
            {/* HERO */}
            <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 relative">
                <div className="mb-6">
                    <GlowOrb />
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-center">
                    <span className="gradient-text">AI Job Assistant</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-center mb-8">
                    Интеллектуальный ассистент, который ищет вакансии, адаптирует резюме и пишет сопроводительные письма за вас
                </p>

                <button
                    onClick={scrollToAuth}
                    className={cn(
                        "h-12 px-8 rounded-full font-medium text-base text-white",
                        "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                        "hover:from-violet-500 hover:to-fuchsia-500",
                        "shadow-glow transition-all duration-300",
                        "flex items-center gap-2"
                    )}
                >
                    Начать <ArrowDown className="w-4 h-4" />
                </button>
            </section>

            {/* FEATURES */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                        <span className="gradient-text">Что умеет ассистент</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "glass-card p-6 transition-all duration-300",
                                    "hover:border-violet-500/20 hover:shadow-glow"
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AUTH */}
            <section ref={authRef} className="py-16 px-4 flex justify-center">
                <div className="w-full max-w-sm">
                    {/* Tabs */}
                    <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab("login")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all",
                                activeTab === "login"
                                    ? "bg-violet-600 text-white shadow-glow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LogIn className="w-4 h-4" /> Войти
                        </button>
                        <button
                            onClick={() => setActiveTab("register")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all",
                                activeTab === "register"
                                    ? "bg-violet-600 text-white shadow-glow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <UserPlus className="w-4 h-4" /> Регистрация
                        </button>
                    </div>

                    <div className="glass-card p-6">
                        {activeTab === "login" ? (
                            <form onSubmit={handleLogin} className="space-y-3">
                                <p className="text-sm text-muted-foreground text-center mb-2">
                                    Уже есть аккаунт? Войдите
                                </p>
                                <input
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Пароль"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                                {loginError && (
                                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                        {loginError}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className={cn(
                                        "w-full h-10 rounded-lg font-medium text-sm text-white",
                                        "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                                        "hover:from-violet-500 hover:to-fuchsia-500",
                                        "shadow-glow transition-all duration-300",
                                        "disabled:opacity-50"
                                    )}
                                    disabled={loginLoading}
                                >
                                    {loginLoading ? 'Вход...' : 'Войти'}
                                </button>
                                <p className="text-xs text-center text-muted-foreground">
                                    У меня ещё нет аккаунта —{" "}
                                    <button type="button" onClick={() => setActiveTab("register")} className="text-violet-400 hover:text-violet-300 underline">
                                        зарегистрироваться
                                    </button>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-3">
                                <p className="text-sm text-muted-foreground text-center mb-2">
                                    Создайте аккаунт, чтобы начать
                                </p>
                                <input
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Имя"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <input
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Телефон"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                    placeholder="Повторите пароль"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                />
                                {regError && (
                                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                        {regError}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className={cn(
                                        "w-full h-10 rounded-lg font-medium text-sm text-white",
                                        "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                                        "hover:from-violet-500 hover:to-fuchsia-500",
                                        "shadow-glow transition-all duration-300",
                                        "disabled:opacity-50"
                                    )}
                                    disabled={regLoading}
                                >
                                    {regLoading ? 'Регистрация...' : 'Создать аккаунт'}
                                </button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Уже есть аккаунт?{" "}
                                    <button type="button" onClick={() => setActiveTab("login")} className="text-violet-400 hover:text-violet-300 underline">
                                        войти
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
