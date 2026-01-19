'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split('/').filter((path) => path);

    // Don't show on root or just dashboard
    if (paths.length <= 1) return null;

    // Custom label mapping for better UX
    const labelMap: Record<string, string> = {
        'ticker': 'Stock Search',
        'dcf': 'DCF Calculator',
        'portfolios': 'Portfolios',
        'manage': 'Command Center',
        'watchlist': 'Watchlist',
        'alerts': 'Price Alerts',
        'stocks': 'Stock Search',
        'report': 'Report',
        'import': 'Import',
        'account': 'Account',
    };

    const breadcrumbs = paths
        // Skip the first 'dashboard' segment since we show it as Home
        .filter((path, index) => !(index === 0 && path.toLowerCase() === 'dashboard'))
        .map((path, index, filteredPaths) => {
            // Reconstruct href considering we always start with /dashboard
            const href = `/dashboard/${filteredPaths.slice(0, index + 1).join('/')}`;
            // Use label map or capitalize
            const label = labelMap[path.toLowerCase()] ||
                (path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '));
            const isLast = index === filteredPaths.length - 1;

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
