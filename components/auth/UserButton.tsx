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
                className="flex items-center gap-3 bg-card px-4 py-2 rounded-2xl border border-border hover:bg-muted transition-all shadow-sm"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
                    <UserIcon size={16} />
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Account</p>
                    <p className="text-sm text-foreground font-black leading-tight truncate max-w-[100px]">
                        {user.email?.split('@')[0]}
                    </p>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-[24px] shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Signed in as</p>
                            <p className="text-sm text-foreground font-black truncate">{user.email}</p>
                        </div>

                        <div className="p-2">
                            <Link
                                href="/dashboard/account"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-bold text-sm"
                            >
                                <Settings size={18} />
                                <span>Account Settings</span>
                            </Link>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    signOut();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all font-bold text-sm"
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
