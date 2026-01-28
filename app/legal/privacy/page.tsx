'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Database, Lock, Eye, CheckCircle2, Mail, Cookie } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const processors = [
        { name: "Supabase", location: "EU (Frankfurt) / USA", purpose: "Database & Authentication / Adatbázis és Hitelesítés", legalBasis: "Performance of Contract / Szerződés teljesítése" },
        { name: "Vercel", location: "USA (Global Edge)", purpose: "Hosting & Application Delivery / Tárhely és Kiszolgálás", legalBasis: "Performance of Contract / Szerződés teljesítése" },
        { name: "Sentry", location: "USA", purpose: "Security & Error Tracking / Biztonság és Hibajavítás", legalBasis: "Legitimate Interest / Jogos érdek" },
        { name: "PostHog", location: "EU / USA", purpose: "Analytics (Anonymized IP) / Analitika", legalBasis: "Consent / Hozzájárulás" },
        { name: "Google Workspace", location: "USA / EU", purpose: "System Emails / Rendszerüzenetek kiküldése", legalBasis: "Performance of Contract / Szerződés teljesítése" },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home / Vissza a főoldalra
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[48px] p-8 md:p-12 shadow-2xl space-y-16">
                    {/* ENGLISH VERSION */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/20 rounded-2xl">
                                <Shield className="text-blue-400" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Privacy Policy</h1>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-6">
                            <p className="text-slate-300 leading-relaxed font-medium">
                                At StockTrackr.eu, we prioritize your data security. We collect only what is necessary to provide an advanced
                                stock tracking experience and comply with European GDPR standards.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-700/50">
                                    <Database className="text-blue-400 mb-4" size={24} />
                                    <h3 className="text-white font-bold mb-2">What we collect</h3>
                                    <p className="text-sm text-slate-400">Email addresses for login, your stock portfolio holdings, and encrypted platform preferences.</p>
                                </div>
                                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-700/50">
                                    <Eye className="text-emerald-400 mb-4" size={24} />
                                    <h3 className="text-white font-bold mb-2">Privacy Focus</h3>
                                    <p className="text-sm text-slate-400">We anonymize IP addresses in our analytics and perform regular data security audits.</p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white pt-8">Data Processors & Legal Basis</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest pr-4">Processor</th>
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest pr-4">Purpose</th>
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest">Legal Basis (GDPR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {processors.map((p, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="py-4 text-sm font-bold text-white pr-4">{p.name}</td>
                                                <td className="py-4 text-sm text-slate-400 pr-4">{p.purpose.split(' / ')[0]}</td>
                                                <td className="py-4 text-sm text-blue-400 font-medium">{p.legalBasis.split(' / ')[0]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 bg-slate-900/50 rounded-[32px] border border-slate-700/50 mt-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <Cookie className="text-amber-500" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Cookie Management</h3>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    We use essential cookies for authentication and performance cookies for analytics. You can manage your preferences at any time.
                                </p>
                                <button
                                    onClick={() => (window as any).showCookieSettings?.()}
                                    className="text-primary hover:underline text-sm font-black"
                                >
                                    Open Cookie Settings
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="border-t-2 border-dashed border-slate-700/50 py-4 flex items-center justify-center">
                        <span className="bg-slate-800 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-slate-500 border border-slate-700">
                            --- Magyar / Hungarian Version ---
                        </span>
                    </div>

                    {/* HUNGARIAN VERSION */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                <Lock className="text-emerald-400" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Adatvédelmi Nyilatkozat</h1>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-6">
                            <p className="text-slate-300 leading-relaxed font-medium">
                                A StockTrackr.eu kiemelt figyelmet fordít az Ön adatainak biztonságára. Kizárólag azokat az adatokat kezeljük,
                                amelyek elengedhetetlenek a szolgáltatás nyújtásához, összhangban a GDPR előírásaival.
                            </p>

                            <h2 className="text-2xl font-black text-white pt-8">Adatfeldolgozók és Jogalapok</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest pr-4">Feldolgozó</th>
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest pr-4">Cél</th>
                                            <th className="py-4 font-black uppercase text-[10px] text-slate-500 tracking-widest">Jogalap (GDPR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {processors.map((p, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="py-4 text-sm font-bold text-white pr-4">{p.name}</td>
                                                <td className="py-4 text-sm text-slate-400 pr-4">{p.purpose.includes(' / ') ? p.purpose.split(' / ')[1] : p.purpose}</td>
                                                <td className="py-4 text-sm text-emerald-400 font-medium">{p.legalBasis.includes(' / ') ? p.legalBasis.split(' / ')[1] : p.legalBasis}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 bg-blue-500/5 rounded-[32px] border border-blue-500/20 mt-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <Shield className="text-blue-400" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Érintetti Jogok / Data Rights</h3>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    To exercise your rights (access, deletion, export), please use the "Account" settings page or contact our Data Protection Officer at:
                                    / Jogainak gyakorlásához (hozzáférés, törlés, adathordozhatóság) kérjük használja a "Fiók" beállításokat vagy vegye fel a kapcsolatot adatvédelmi tisztségviselőnkkel:
                                </p>
                                <a href="mailto:info@prometheusdigital.hu" className="flex items-center gap-2 text-primary hover:text-primary/80 text-base font-black transition-colors w-fit">
                                    <Mail size={18} />
                                    info@prometheusdigital.hu
                                </a>
                            </div>

                            <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/20 mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="text-primary" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Kiemelt Adatvédelmi Irányelvek</h3>
                                </div>
                                <ul className="space-y-4 text-sm text-slate-400">
                                    <li className="flex gap-3">
                                        <span className="text-primary font-bold">•</span>
                                        Az analitikához használt IP-címeket minden esetben anonimizáljuk.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary font-bold">•</span>
                                        Az adatokat az EU-n belül (Supabase Frankfurt) tároljuk, ahol lehetséges.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary font-bold">•</span>
                                        Bármikor kérheti adatai törlését vagy exportálását a Fiókbeállítások menüpontban.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Last updated / Utoljára frissítve: January 28, 2026
                </div>
            </div>
        </div>
    );
}
