import Link from 'next/link';
import { ArrowLeft, Building2, Mail, ShieldCheck, Globe, Gavel, Scale } from 'lucide-react';

export default function ImpressumPage() {
    const companyInfo = [
        { label: "Company Name / Cégnév", value: "Prometheus Digital Kft." },
        { label: "Registered Seat / Székhely", value: "1125 Budapest, Hableány utca 6/A, Hungary" },
        { label: "Registration Number / Cégjegyzékszám", value: "01-09-434076" },
        { label: "Tax Number / Adószám", value: "32910128-2-43" },
        { label: "Represented by / Képviselő", value: "Bretz Árpád, Managing Director / ügyvezető" },
        { label: "Email / E-mail", value: "info@prometheusdigital.hu" },
        { label: "Phone / Telefon", value: "+36 30 922 2042" },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-16 px-4">
            <div className="container mx-auto max-w-3xl">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home / Vissza a főoldalra
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[48px] p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3 bg-primary/20 rounded-2xl">
                            <Building2 className="text-primary" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Impressum / <span className="text-primary">Impresszum</span></h1>
                    </div>

                    <div className="space-y-6 mb-16">
                        {companyInfo.map((item, idx) => (
                            <div key={idx} className="border-b border-slate-700/50 pb-4 last:border-0 group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 group-hover:text-primary transition-colors">{item.label}</p>
                                <p className="text-lg font-bold text-white tracking-tight">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-8 mb-16">
                        <section className="bg-slate-900/50 rounded-3xl p-8 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="text-emerald-500" size={24} />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Hosting Provider / Tárhelyszolgáltató</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black text-white">Vercel Inc.</p>
                                    <p className="text-sm text-slate-400">340 S Lemon Ave #4133 Walnut, CA 91789, USA</p>
                                </div>
                                <div className="flex flex-col gap-3 py-2">
                                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Abuse & Legal Contact</p>
                                        <a href="mailto:privacy@vercel.com" className="flex items-center gap-2 text-primary hover:text-primary/80 text-base font-black transition-colors">
                                            <Mail size={18} />
                                            privacy@vercel.com
                                        </a>
                                    </div>
                                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold w-fit transition-colors px-2">
                                        <Globe size={16} />
                                        www.vercel.com
                                    </a>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-900/50 rounded-3xl p-8 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <Gavel className="text-blue-400" size={24} />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Supervisory Authority / Felügyeleti Hatóság</h2>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Protection Authority (NAIH)</p>
                                <p className="text-sm font-black text-white leading-relaxed">
                                    Nemzeti Adatvédelmi és Információszabadság Hatóság<br />
                                    <span className="text-slate-400 font-medium">1055 Budapest, Falk Miksa utca 9-11.</span>
                                </p>
                                <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-black w-fit">
                                    <Globe size={16} />
                                    www.naih.hu
                                </a>
                            </div>
                        </section>

                        <section className="bg-slate-900/50 rounded-3xl p-8 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <Scale className="text-amber-500" size={24} />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Online Dispute Resolution / Vitarendezés</h2>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                The EU Commission provides a platform for online dispute resolution. / Az Európai Bizottság platformot biztosít az online vitarendezéshez.
                            </p>
                            <a
                                href="https://ec.europa.eu/consumers/odr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500 text-sm font-black hover:bg-amber-500/20 transition-all"
                            >
                                <ExternalLinkIcon size={16} />
                                ec.europa.eu/consumers/odr
                            </a>
                        </section>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        Last Updated / Utoljára frissítve: January 28, 2026<br />
                        © 2026 Prometheus Digital Kft. • All Rights Reserved / Minden jog fenntartva
                    </p>
                </div>
            </div>
        </div>
    );
}

function ExternalLinkIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
    )
}
