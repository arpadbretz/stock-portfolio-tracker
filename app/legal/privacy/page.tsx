export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 md:p-24 selection:bg-emerald-500/30">
            <article className="max-w-3xl mx-auto prose prose-invert prose-emerald">
                <h1 className="text-4xl font-bold text-white mb-8 border-b border-slate-700 pb-4">Privacy Policy (Adatvédelmi Nyilatkozat)</h1>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-4">1. Data Controller (Adatkezelő)</h2>
                    <p className="text-slate-300 leading-relaxed italic">
                        [Your Name or Company Name]<br />
                        [Your Address]<br />
                        Email: [Your Support Email]
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-4">2. Purpose of Data Processing</h2>
                    <p className="text-slate-300 leading-relaxed">
                        We collect and process your email address exclusively for the purpose of providing access to the Stock Portfolio Tracker, enabling user-specific data storage, and ensuring account security. This is processed under the legal basis of performing a contract (Art. 6(1)(b) of the GDPR).
                    </p>
                    <p className="text-slate-300 mt-2 font-medium">
                        (Az adatkezelés célja a Stock Portfolio Tracker szolgáltatás nyújtása, a felhasználó-specifikus adatok tárolása és a fiók biztonságának garantálása.)
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-4">3. Data Storage & Subprocessors</h2>
                    <p className="text-slate-300 leading-relaxed">
                        Your data is stored securely using **Supabase** (Supabase Inc.). While Supabase is a US-based entity, we process data using their Frankfurt, Germany (eu-central-1) region to ensure high protection standards within the EEA.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-4">4. Your Rights</h2>
                    <p className="text-slate-300 leading-relaxed">
                        Under the GDPR and Hungarian Info Act (Infótörvény), you have the right to request access to, rectification, or erasure of your personal data. You may also object to processing or request data portability.
                    </p>
                </section>

                <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500">
                    Last updated: January 2026
                </div>
            </article>
        </div>
    );
}
