'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function UserButton() {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
                    <UserIcon size={16} />
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-xs text-slate-400 font-medium">Account</p>
                    <p className="text-sm text-white font-bold leading-tight truncate max-w-[120px]">
                        {user.email?.split('@')[0]}
                    </p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
                        <div className="p-3 border-b border-slate-700">
                            <p className="text-xs text-slate-400">Signed in as</p>
                            <p className="text-sm text-white font-medium truncate">{user.email}</p>
                        </div>

                        <div className="py-1">
                            <Link
                                href="/account"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                <Settings size={18} />
                                <span>Account Settings</span>
                            </Link>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    signOut();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-rose-400 transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
