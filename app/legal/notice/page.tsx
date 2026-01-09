import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Phone, Globe } from 'lucide-react';

export default function LegalNoticePage() {
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
                    <div className="flex items-center gap-3 mb-8">
                        <Building2 className="text-blue-400" size={32} />
                        <h1 className="text-4xl font-bold text-white">Legal Notice</h1>
                    </div>

                    <div className="space-y-8">
                        {/* Service Provider Information */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">
                                Service Provider Information
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Company Name</p>
                                    <p className="text-white font-semibold">Prometheus Digital Kft.</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Registered Address</p>
                                    <p className="text-white font-semibold">1125 Budapest, Hableány utca 6/A, Hungary</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Company Registration Number</p>
                                    <p className="text-white font-semibold">01-09-434076</p>
                                    <p className="text-xs text-slate-500 mt-1">Registered by: Budapest Metropolitan Court of Registration</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Tax Number</p>
                                    <p className="text-white font-semibold">32910128-2-43</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Represented by</p>
                                    <p className="text-white font-semibold">Bretz Árpád, Managing Director</p>
                                </div>
                            </div>
                        </section>

                        {/* Contact Information */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">
                                Contact Information
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <Mail className="text-blue-400 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-slate-400">Email</p>
                                        <a href="mailto:info@prometheusdigital.hu" className="text-white font-semibold hover:text-blue-400 transition-colors">
                                            info@prometheusdigital.hu
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <Phone className="text-blue-400 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-slate-400">Phone</p>
                                        <a href="tel:+36309222042" className="text-white font-semibold hover:text-blue-400 transition-colors">
                                            +36 30 922 2042
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Hosting Provider */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">
                                Hosting Provider
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Name</p>
                                    <p className="text-white font-semibold">Vercel Inc.</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Address</p>
                                    <p className="text-white font-semibold">440 N Barranca Ave #4133</p>
                                    <p className="text-white font-semibold">Covina, CA 91723, USA</p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Website</p>
                                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold flex items-center gap-2">
                                        <Globe size={16} />
                                        vercel.com
                                    </a>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Email</p>
                                    <a href="mailto:privacy@vercel.com" className="text-white font-semibold hover:text-blue-400 transition-colors">
                                        privacy@vercel.com
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* Copyright Notice */}
                        <section className="border-t border-slate-700 pt-6">
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    <strong>Copyright:</strong> All content on this website (text, images, design elements) is protected by copyright.
                                    Copying or reproduction without the written permission of the owner is prohibited.
                                    All rights reserved © 2026 Prometheus Digital Kft.
                                </p>
                            </div>
                        </section>

                        {/* Legal Links */}
                        <div className="flex flex-wrap gap-4 justify-center pt-6 text-sm">
                            <Link href="/legal/privacy" className="text-blue-400 hover:underline">
                                Privacy Policy
                            </Link>
                            <span className="text-slate-600">•</span>
                            <Link href="/legal/terms" className="text-blue-400 hover:underline">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
