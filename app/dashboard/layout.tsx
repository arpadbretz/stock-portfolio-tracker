'use client';

import Navigation from '@/components/Navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <div className="lg:pl-64 pt-16 lg:pt-0">
                {children}
            </div>
        </div>
    );
}
