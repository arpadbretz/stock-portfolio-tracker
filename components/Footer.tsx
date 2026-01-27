'use client';

import Link from 'next/link';
import { TrendingUp, Github, Twitter, Mail, ExternalLink, Shield, FileText, Building2 } from 'lucide-react';

interface FooterLink {
    name: string;
    href: string;
    external?: boolean;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const sections: { title: string; links: FooterLink[] }[] = [
        {
            title: "Platform",
            links: [
                { name: "Dashboard", href: "/dashboard" },
                { name: "Portfolios", href: "/dashboard/portfolios" },
                { name: "Valuation Tools", href: "/dashboard/valuation" },
                { name: "Research", href: "/dashboard/research" },
            ]
        },
        {
            title: "Legal & Privacy",
            links: [
                { name: "Privacy Policy", href: "/legal/privacy", icon: Shield },
                { name: "Terms of Service", href: "/legal/terms", icon: FileText },
                { name: "Impressum", href: "/legal/impressum", icon: Building2 },
            ]
        },
        {
            title: "Connect",
            links: [
                { name: "GitHub", href: "https://github.com", external: true, icon: Github },
                { name: "Twitter", href: "https://twitter.com", external: true, icon: Twitter },
                { name: "Support", href: "mailto:info@prometheusdigital.hu", icon: Mail },
            ]
        }
    ];

    return (
        <footer className="mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="p-2 bg-primary rounded-xl group-hover:rotate-12 transition-transform duration-300">
                                <TrendingUp className="text-primary-foreground" size={24} />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-foreground uppercase">
                                Stock<span className="text-primary">Trackr</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Premium investment tracking and valuation tools for modern investors.
                            Built for accuracy, privacy, and performance.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                                <Github size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Links Sections */}
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">
                                {section.title}
                            </h3>
                            <ul className="space-y-4">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            target={link.external ? "_blank" : undefined}
                                            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group w-fit"
                                        >
                                            {link.icon && <link.icon size={14} className="group-hover:text-primary transition-colors" />}
                                            {link.name}
                                            {link.external && <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        © {currentYear} Prometheus Digital Kft. • Made in Budapest, EU
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Systems Operational</span>
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground/50 italic">
                            v0.1.0-beta
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
