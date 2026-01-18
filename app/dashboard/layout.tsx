'use client';

import Navigation from '@/components/Navigation';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Shared Dashboard Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            <Navigation />
            <div className="lg:pl-72 pt-20 lg:pt-0 min-h-screen">
                <main className="max-w-[1600px] mx-auto px-6 py-8 lg:py-12">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    );
}
