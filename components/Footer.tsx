import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900/50 border-t border-slate-800 mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Prometheus Digital Kft.</h3>
                        <p className="text-sm text-slate-400 mb-2">1125 Budapest, Hableány utca 6/A</p>
                        <p className="text-sm text-slate-400 mb-2">Tax Number: 32910128-2-43</p>
                        <p className="text-sm text-slate-400">Company Reg. No.: 01-09-434076</p>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Legal Information</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/legal/notice" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                                    Legal Notice
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/terms" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                        <div className="space-y-2">
                            <a
                                href="mailto:info@prometheusdigital.hu"
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                <Mail size={16} />
                                info@prometheusdigital.hu
                            </a>
                            <a
                                href="tel:+36309222042"
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                <Phone size={16} />
                                +36 30 922 2042
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        © 2026 Prometheus Digital Kft. All rights reserved. |
                        Hosting: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Vercel</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
