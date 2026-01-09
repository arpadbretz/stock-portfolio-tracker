'use client';

import { LayoutDashboard, PlusCircle, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface MobileNavProps {
    onAddClick?: () => void;
    showAddButton?: boolean;
}

export default function MobileNav({ onAddClick, showAddButton = true }: MobileNavProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800" />

            <div className="relative flex items-center justify-around p-2 pb-safe">
                {/* Home Tab */}
                <Link href="/" className="flex flex-col items-center gap-1 p-2 min-w-[64px]">
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive('/') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
                        <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive('/') ? 'text-emerald-400' : 'text-slate-500'}`}>
                        Home
                    </span>
                </Link>

                {/* Add Button (Floating) */}
                {showAddButton && (
                    <div className="-mt-8">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onAddClick}
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 border-4 border-slate-900"
                        >
                            <PlusCircle size={28} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                )}

                {/* Account Tab */}
                <Link href="/account" className="flex flex-col items-center gap-1 p-2 min-w-[64px]">
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive('/account') ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>
                        <User size={24} strokeWidth={isActive('/account') ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive('/account') ? 'text-blue-400' : 'text-slate-500'}`}>
                        Account
                    </span>
                </Link>
            </div>
        </div>
    );
}
