'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split('/').filter((path) => path);

    // Don't show on root or just dashboard
    if (paths.length <= 1) return null;

    const breadcrumbs = paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        const isLast = index === paths.length - 1;

        return { label, href, isLast };
    });

    return (
        <nav className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground overflow-x-auto no-scrollbar py-2">
            <Link
                href="/dashboard"
                className="flex items-center gap-1.5 hover:text-primary transition-colors flex-shrink-0"
            >
                <Home size={12} />
                <span>Dashboard</span>
            </Link>

            {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.href} className="flex items-center gap-2 flex-shrink-0">
                    <ChevronRight size={10} className="text-muted-foreground/40" />
                    {crumb.isLast ? (
                        <span className="text-foreground">{crumb.label}</span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="hover:text-primary transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
