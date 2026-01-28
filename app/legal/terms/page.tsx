import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, Scale, CheckCircle2, Ban, Globe } from 'lucide-react';

export default function TermsOfServicePage() {
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
                            <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                <FileText className="text-indigo-400" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Terms of Service</h1>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-8">
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[32px] p-8 mb-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="text-amber-500" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Financial Disclaimer</h3>
                                </div>
                                <p className="text-sm text-amber-500/90 leading-relaxed font-bold">
                                    The Service provide tools for informational purposes only. Data provided by third parties (such as Yahoo Finance) is not guaranteed to be
                                    accurate or real-time. This application does NOT constitute financial, investment, or legal advice.
                                    Investments carry risk of loss.
                                </p>
                            </div>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-primary" />
                                    1. Use of Service & Performance
                                </h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    By creating an account, you agree to provide accurate information and maintain the security of your credentials.
                                    Unauthorized commercial reproduction of the site's analytics or scraping of data is strictly prohibited.
                                </p>
                                <p className="text-slate-400 text-xs italic bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                    By using the Service, you acknowledge that it constitutes digital content and you expressly consent to the immediate commencement of performance, thereby waiving your 14-day right of withdrawal for digital services once performance has begun.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <Ban size={20} className="text-rose-400" />
                                    2. Termination
                                </h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    We reserve the right to suspend or terminate accounts that violate these terms, including but not limited to abusive API usage, automated scraping, or any activity that compromises platform stability.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <Globe size={20} className="text-blue-400" />
                                    3. Jurisdiction
                                </h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    These Terms are governed by the laws of Hungary. The courts of Budapest shall have exclusive jurisdiction over any disputes arising from or related to the use of this Service.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase">4. Limitation of Liability</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    StockTrackr.eu and Prometheus Digital Kft. shall not be liable for any financial losses incurred through the use of
                                    this application. All investment decisions are the sole responsibility of the user.
                                </p>
                            </section>
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
                            <div className="p-3 bg-primary/20 rounded-2xl">
                                <Scale className="text-primary" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Általános Szerződési Feltételek</h1>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-8">
                            <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 mb-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="text-primary" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Befektetési Felelősségkizárás</h3>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed font-bold">
                                    Az alkalmazás által szolgáltatott adatok kizárólag tájékoztató jellegűek. A harmadik felek (például Yahoo Finance)
                                    által biztosított adatok pontosságáért vagy késleltetéséért felelősséget nem vállalunk. A szolgáltatás
                                    NEM minősül befektetési, pénzügyi vagy jogi tanácsadásnak.
                                </p>
                            </div>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase">1. Szolgáltatás igénybevétele</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    A regisztrációval Ön elfogadja, hogy valós adatokat ad meg és felelős saját belépési adatai biztonságáért.
                                    Az alkalmazás analitikáinak jogosulatlan kereskedelmi célú felhasználása vagy automatizált adatgyűjtése (scraping) tilos.
                                </p>
                                <p className="text-slate-400 text-xs italic bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                    A szolgáltatás használatával Ön tudomásul veszi, hogy az digitális adattartalomnak minősül, és kifejezetten hozzájárul a teljesítés azonnali megkezdéséhez, amellyel elveszíti a 14 napos elállási jogát a teljesítés megkezdését követően.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase">2. Felmondás</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Fenntartjuk a jogot a fiókok felfüggesztésére vagy törlésére, amennyiben a felhasználó megsérti a jelen feltételeket, beleértve az API-val való visszaélést, az automatizált adatgyűjtést vagy a platform stabilitását veszélyeztető tevékenységeket.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xl font-black text-white uppercase">3. Felelősség korlátozása</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    A StockTrackr.eu és a Prometheus Digital Kft. nem vállal felelősséget az alkalmazás használata során
                                    esetlegesen keletkező pénzügyi veszteségekért. Minden befektetési döntés a felhasználó kizárólagos felelőssége.
                                </p>
                            </section>

                            <div className="p-8 bg-slate-900/50 rounded-[32px] border border-slate-700/50 mt-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <Scale className="text-emerald-500" size={24} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Irányadó Jog és Illetékesség</h3>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    A jelen feltételekre Magyarország és az Európai Unió jogszabályai az irányadóak. Bármilyen, a szolgáltatással kapcsolatos jogvita esetén a felek alávetik magukat a budapesti székhelyű bíróságok kizárólagos illetékességének.
                                </p>
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
