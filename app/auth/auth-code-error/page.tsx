'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthCodeErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
            <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl text-center">
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <AlertCircle className="text-red-400" size={48} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    Authentication Error
                </h1>

                <p className="text-slate-400 mb-6">
                    There was a problem confirming your email or completing the authentication process.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                        Go to Login
                    </Link>

                    <Link
                        href="/register"
                        className="block w-full py-3 px-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
                    >
                        Register New Account
                    </Link>
                </div>

                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg text-left">
                    <p className="text-xs text-slate-400 mb-2">
                        <strong className="text-slate-300">Common issues:</strong>
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        <li>Email confirmation link expired (valid for 24 hours)</li>
                        <li>Link already used</li>
                        <li>Email not verified yet</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
