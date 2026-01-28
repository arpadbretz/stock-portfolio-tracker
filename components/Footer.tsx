'use client';

import Link from 'next/link';
import { TrendingUp, Shield, FileText, Building2, AlertTriangle, Settings } from 'lucide-react';
import { useConsent } from './providers/ConsentProvider';

interface FooterLink {
    name: string;
    href: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { setModalOpen } = useConsent();

    const legalLinks: FooterLink[] = [
        { name: "Privacy Policy", href: "/legal/privacy", icon: Shield },
        { name: "Terms of Service", href: "/legal/terms", icon: FileText },
        { name: "Impressum", href: "/legal/impressum", icon: Building2 },
    ];

    return (
        <footer className="mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <div className="flex flex-col md:flex-row md:justify-between gap-10 md:gap-12 items-start">
                    {/* Brand & Disclosure */}
                    <div className="space-y-6 w-full md:max-w-md">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="p-2 bg-primary rounded-xl group-hover:rotate-12 transition-transform duration-300">
                                <TrendingUp className="text-primary-foreground" size={24} />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-foreground uppercase">
                                Stock<span className="text-primary">Trackr</span>
                            </span>
                        </Link>

                        <div className="space-y-4">
                            <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl w-full">
                                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                <p className="text-[10px] sm:text-[11px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-tight break-words">
                                    Financial Disclaimer: The information provided is for informational purposes only
                                    and does not constitute financial advice. / A feltüntetett információk kizárólag
                                    tájékoztató jellegűek, nem minősülnek befektetési tanácsadásnak.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="w-full md:w-auto flex flex-col items-start md:items-end md:text-right">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 md:mb-6">
                            Legal & Compliance
                        </h3>
                        <ul className="flex flex-wrap gap-x-6 gap-y-4 md:justify-end items-center">
                            {legalLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group whitespace-nowrap"
                                    >
                                        {link.icon && <link.icon size={14} className="group-hover:text-primary transition-colors shrink-0" />}
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group whitespace-nowrap"
                                >
                                    <Settings size={14} className="group-hover:text-primary transition-colors shrink-0" />
                                    Manage Cookies
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        © {currentYear} Prometheus Digital Kft. • Budapest, EU
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">GDPR Compliant</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
