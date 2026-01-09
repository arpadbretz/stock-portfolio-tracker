import Link from 'next/link';
import { Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-card/50 backdrop-blur-md border-t border-border mt-auto">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand/Company Info */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-1.5 bg-primary/20 rounded-lg">
                                <ShieldCheck className="text-primary" size={24} />
                            </div>
                            <span className="text-xl font-bold tracking-tight">StockTrackr.eu</span>
                        </div>
                        <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">Prometheus Digital Kft.</h3>
                        <div className="space-y-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                            <p>1125 Budapest, Hableány utca 6/A</p>
                            <p>Tax Number: 32910128-2-43</p>
                            <p>Company Reg. No.: 01-09-434076</p>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-[10px] font-black text-foreground mb-6 uppercase tracking-[0.2em]">Foundation</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/legal/notice" className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest">
                                    Legal Notice
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-[10px] font-black text-foreground mb-6 uppercase tracking-[0.2em]">Contact Node</h3>
                        <div className="space-y-4">
                            <a
                                href="mailto:info@prometheusdigital.hu"
                                className="flex items-center gap-3 text-xs text-muted-foreground hover:text-primary transition-colors font-bold tracking-tight"
                            >
                                <div className="p-2 bg-muted rounded-xl">
                                    <Mail size={14} />
                                </div>
                                info@prometheusdigital.hu
                            </a>
                            <a
                                href="tel:+36309222042"
                                className="flex items-center gap-3 text-xs text-muted-foreground hover:text-primary transition-colors font-bold tracking-tight"
                            >
                                <div className="p-2 bg-muted rounded-xl">
                                    <Phone size={14} />
                                </div>
                                +36 30 922 2042
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        © 2026 Prometheus Digital Kft. Secure Asset Management.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                            Infrastructure:
                            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                                Vercel <ExternalLink size={10} />
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
