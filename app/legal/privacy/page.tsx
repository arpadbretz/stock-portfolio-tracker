import Link from 'next/link';
import { ArrowLeft, Shield, Database, Eye, Download, Trash2, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-blue-400" size={32} />
                        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-400 mb-2">Adatvédelmi Nyilatkozat</p>
                    <p className="text-slate-400 mb-8">Last updated: January 9, 2026</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed">
                        {/* Introduction */}
                        <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                            <p className="text-white font-medium mb-2">GDPR & Hungarian Compliance</p>
                            <p className="text-sm">
                                This Privacy Policy complies with the General Data Protection Regulation (GDPR) (EU) 2016/679
                                and the Hungarian Information Act (2011. évi CXII. törvény). We are committed to protecting your
                                personal data and your right to privacy.
                            </p>
                        </section>

                        {/* Data Controller */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="text-blue-400" size={24} />
                                <h2 className="text-2xl font-semibold text-white">1. Data Controller</h2>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="mb-2"><strong>Company Name:</strong> Prometheus Digital Kft.</p>
                                <p className="mb-2"><strong>Address:</strong> 1125 Budapest, Hableány utca 6/A, Hungary</p>
                                <p className="mb-2"><strong>Company Registration Number:</strong> 01-09-434076</p>
                                <p className="mb-2"><strong>Tax Number:</strong> 32910128-2-43</p>
                                <p className="mb-2"><strong>Represented by:</strong> Bretz Árpád, Managing Director</p>
                                <p className="mb-2"><strong>Email:</strong> info@prometheusdigital.hu</p>
                                <p><strong>Phone:</strong> +36 30 922 2042</p>
                            </div>
                        </section>

                        {/* What Data We Collect */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Database className="text-blue-400" size={24} />
                                <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-3">Account Information</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                <li><strong>Email address:</strong> Used for authentication and account recovery</li>
                                <li><strong>Password:</strong> Stored in encrypted form (we cannot access your password)</li>
                                <li><strong>Profile preferences:</strong> Currency preference, theme settings</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-3">Portfolio Data</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                <li><strong>Stock holdings:</strong> Ticker symbols, quantities, purchase prices</li>
                                <li><strong>Trade history:</strong> Buy/sell transactions, fees, notes</li>
                                <li><strong>Portfolio performance:</strong> Calculated gains/losses, allocation data</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-3">Technical Data</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Session cookies:</strong> Essential for authentication and security</li>
                                <li><strong>Usage data:</strong> If you consent to analytics cookies</li>
                                <li><strong>IP address:</strong> Temporarily logged for security purposes</li>
                            </ul>
                        </section>

                        {/* Legal Basis */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">3. Legal Basis for Processing</h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Contract Performance (GDPR Art. 6(1)(b))</p>
                                    <p className="text-sm">Processing your account and portfolio data is necessary to provide the portfolio tracking service you requested.</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Consent (GDPR Art. 6(1)(a))</p>
                                    <p className="text-sm">Analytics and marketing cookies are used only with your explicit consent via the cookie banner.</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Legitimate Interest (GDPR Art. 6(1)(f))</p>
                                    <p className="text-sm">Security measures, fraud prevention, and service improvement.</p>
                                </div>
                            </div>
                        </section>

                        {/* Data Storage */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage & Security</h2>
                            <p className="mb-4">
                                Your data is stored using <strong>Supabase</strong> (Supabase Inc.), a secure cloud database platform.
                                We use their <strong>EU Central region (Frankfurt, Germany)</strong> to ensure GDPR compliance and data sovereignty.
                            </p>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="font-semibold mb-2">Security Measures:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>End-to-end encryption for data in transit (TLS/SSL)</li>
                                    <li>Encrypted storage at rest (AES-256)</li>
                                    <li>Row Level Security (RLS) policies - users can only access their own data</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Password hashing using industry-standard algorithms</li>
                                </ul>
                            </div>
                        </section>

                        {/* Third Party Services */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services & Data Processors</h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Supabase (Database & Authentication)</p>
                                    <p className="text-sm mb-2">Location: EU (Frankfurt) | Purpose: Data storage, user authentication</p>
                                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                                        View Supabase Privacy Policy →
                                    </a>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Netlify (Hosting & Deployment)</p>
                                    <p className="text-sm mb-2">
                                        Location: USA (with EU data centers) | Purpose: Web hosting, CDN
                                    </p>
                                    <p className="text-sm mb-2">
                                        Netlify may collect: Server logs (IP addresses, browser info, request URLs) for security and performance monitoring.
                                        Data is logged temporarily and used solely for operational purposes.
                                    </p>
                                    <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                                        View Netlify Privacy Policy →
                                    </a>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Yahoo Finance (Stock Prices)</p>
                                    <p className="text-sm">Purpose: Real-time stock price data (no personal data shared)</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">GitHub OAuth (Optional Login)</p>
                                    <p className="text-sm">We receive only your email address from GitHub if you use OAuth login</p>
                                </div>
                            </div>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Account data:</strong> Retained as long as your account is active</li>
                                <li><strong>Portfolio data:</strong> Retained until you delete it or close your account</li>
                                <li><strong>Deleted accounts:</strong> All data permanently deleted within 30 days</li>
                                <li><strong>Security logs:</strong> Retained for 90 days</li>
                            </ul>
                        </section>

                        {/* User Rights */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Eye className="text-blue-400" size={24} />
                                <h2 className="text-2xl font-semibold text-white">7. Your Rights (GDPR)</h2>
                            </div>
                            <p className="mb-4">Under the GDPR and Hungarian Information Act, you have the following rights:</p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <Eye size={16} className="text-blue-400" />
                                        Right to Access
                                    </p>
                                    <p className="text-sm">Request a copy of all your personal data</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-400" />
                                        Right to Rectification
                                    </p>
                                    <p className="text-sm">Correct inaccurate personal data</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <Trash2 size={16} className="text-blue-400" />
                                        Right to Erasure
                                    </p>
                                    <p className="text-sm">Request deletion of your data</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <Download size={16} className="text-blue-400" />
                                        Right to Data Portability
                                    </p>
                                    <p className="text-sm">Receive your data in a portable format</p>
                                </div>
                            </div>

                            <p className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                <strong>To exercise these rights:</strong> Visit your <Link href="/account" className="text-blue-400 hover:underline">Account Settings</Link> or
                                email us at [Your Email]. We will respond within 30 days.
                            </p>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies</h2>
                            <p className="mb-4">We use cookies to provide and improve our Service. You can manage cookie preferences via the cookie banner.</p>

                            <div className="space-y-3">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Essential Cookies (Always Active)</p>
                                    <p className="text-sm">Required for authentication, security, and core functionality</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Analytics Cookies (Optional)</p>
                                    <p className="text-sm">Help us understand how users interact with the service</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="font-semibold mb-2">Marketing Cookies (Optional)</p>
                                    <p className="text-sm">Used for personalized advertising (currently not implemented)</p>
                                </div>
                            </div>
                        </section>

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                                Privacy Policy on this page and updating the "Last updated" date. Significant changes will be communicated via email.
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
                            <p className="mb-4">For any questions about this Privacy Policy or to exercise your rights:</p>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="mb-2"><strong>Data Protection Officer:</strong> Bretz Árpád</p>
                                <p className="mb-2"><strong>Email:</strong> info@prometheusdigital.hu</p>
                                <p className="mb-2"><strong>Phone:</strong> +36 30 922 2042</p>
                                <p><strong>Address:</strong> 1125 Budapest, Hableány utca 6/A, Hungary</p>
                            </div>
                            <p className="mt-4 text-sm text-slate-400">
                                If you are not satisfied with our response, you have the right to lodge a complaint with the Hungarian
                                National Authority for Data Protection and Freedom of Information (NAIH) at{' '}
                                <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                    naih.hu
                                </a>
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
