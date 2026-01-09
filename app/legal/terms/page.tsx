import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
                    <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-slate-400 mb-8">Last updated: January 9, 2026</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using the Stock Portfolio Tracker ("Service"), you accept and agree to be bound by the terms
                                and provision of this agreement. If you do not agree to abide by the above, please do not use this Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                            <p>
                                Stock Portfolio Tracker provides users with tools to track their investment portfolios, including stock holdings,
                                trades, and performance analytics. The Service is provided "as is" and we reserve the right to modify or
                                discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
                            <p className="mb-3">You agree to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide accurate and complete information when creating your account</li>
                                <li>Maintain the security of your password and account</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                                <li>Use the Service in compliance with all applicable laws and regulations</li>
                                <li>Not use the Service for any illegal or unauthorized purpose</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Financial Disclaimer</h2>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                                <p className="font-semibold text-yellow-400 mb-2">⚠️ Important Notice</p>
                                <p>
                                    The information provided through this Service is for informational purposes only and does not constitute
                                    financial advice, investment advice, trading advice, or any other sort of advice. You should not treat any
                                    of the Service's content as such.
                                </p>
                            </div>
                            <p className="mb-3">We do not recommend that any particular security or portfolio strategy is suitable for any specific person. You should:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Conduct your own research before making any investment decisions</li>
                                <li>Consult with a licensed financial advisor</li>
                                <li>Understand that past performance is not indicative of future results</li>
                                <li>Accept full responsibility for your investment decisions</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Accuracy</h2>
                            <p>
                                While we strive to provide accurate stock price data and portfolio calculations, we do not guarantee the
                                accuracy, completeness, or timeliness of any information provided through the Service. Market data is sourced
                                from third-party providers and may be delayed or contain errors.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                            <p>
                                To the maximum extent permitted by applicable law, in no event shall Stock Portfolio Tracker, its affiliates,
                                officers, directors, employees, or agents be liable for any indirect, incidental, special, consequential, or
                                punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible
                                losses, resulting from:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                                <li>Your access to or use of or inability to access or use the Service</li>
                                <li>Any conduct or content of any third party on the Service</li>
                                <li>Any content obtained from the Service</li>
                                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                                <li>Investment losses resulting from decisions made using the Service</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
                            <p>
                                The Service and its original content (excluding user-generated content), features, and functionality are and
                                will remain the exclusive property of Stock Portfolio Tracker. The Service is protected by copyright, trademark,
                                and other laws. Our trademarks may not be used in connection with any product or service without our prior
                                written consent.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">8. Account Termination</h2>
                            <p className="mb-3">We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including but not limited to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Breach of these Terms of Service</li>
                                <li>Violation of applicable laws</li>
                                <li>Fraudulent or illegal activity</li>
                                <li>At your request for account deletion</li>
                            </ul>
                            <p className="mt-3">
                                Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account,
                                you may do so by contacting us or using the account deletion feature in your account settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is
                                material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a
                                material change will be determined at our sole discretion. By continuing to access or use our Service after
                                those revisions become effective, you agree to be bound by the revised terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">10. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of Hungary and the European Union,
                                without regard to its conflict of law provisions. Our failure to enforce any right or provision of these
                                Terms will not be considered a waiver of those rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
                            <p>
                                If you have any questions about these Terms of Service, please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="font-medium">Prometheus Digital Kft.</p>
                                <p className="font-medium">E-mail: info@prometheusdigital.hu</p>
                                <p className="font-medium">Telefon: +36 30 922 2042</p>
                                <p className="font-medium">Cím: 1125 Budapest, Hableány utca 6/A</p>
                            </div>
                        </section>

                        <section className="border-t border-slate-700 pt-6">
                            <p className="text-sm text-slate-500">
                                By using Stock Portfolio Tracker, you acknowledge that you have read, understood, and agree to be bound by
                                these Terms of Service, and that you have read and understood our{' '}
                                <Link href="/legal/privacy" className="text-blue-400 hover:underline">
                                    Privacy Policy
                                </Link>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
