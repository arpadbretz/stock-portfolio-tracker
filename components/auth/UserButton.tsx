'use client';

import { useAuth } from './AuthProvider';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function UserButton() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
                    <UserIcon size={16} />
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-xs text-slate-400 font-medium">Account</p>
                    <p className="text-sm text-white font-bold leading-tight truncate max-w-[120px]">
                        {user.email?.split('@')[0]}
                    </p>
                </div>
            </div>

            <button
                onClick={signOut}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 transition-all text-slate-400 hover:text-rose-400"
                title="Sign Out"
            >
                <LogOut size={20} />
            </button>
        </div>
    );
}
