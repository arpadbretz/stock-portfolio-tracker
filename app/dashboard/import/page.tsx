'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Upload,
    FileText,
    AlertCircle,
    Check,
    Loader2,
    Download,
    ChevronRight,
    Search
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportedTrade {
    date: string;
    ticker: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    fees: number;
    notes: string;
}

interface Portfolio {
    id: string;
    name: string;
}

export default function ImportPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [parsedTrades, setParsedTrades] = useState<ImportedTrade[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchPortfolios();
        }
    }, [user, authLoading, router]);

    const fetchPortfolios = async () => {
        try {
            const response = await fetch('/api/portfolios');
            if (response.ok) {
                const data = await response.json();
                setPortfolios(data.portfolios || []);
                if (data.defaultPortfolioId) {
                    setSelectedPortfolioId(data.defaultPortfolioId);
                } else if (data.portfolios?.length > 0) {
                    setSelectedPortfolioId(data.portfolios[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching portfolios:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccessCount(null);
            parseCSV(e.target.files[0]);
        }
    };

    const parseCSV = async (file: File) => {
        setIsParsing(true);
        setParsedTrades([]);
        setError(null);

        const text = await file.text();
        const lines = text.split('\n');
        const trades: ImportedTrade[] = [];
        let hasError = false;

        const startIndex = lines[0].toLowerCase().startsWith('date') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            if (cols.length < 5) continue;

            const date = cols[0].trim();
            const ticker = cols[1].trim();
            const action = cols[2].trim().toUpperCase();
            const quantity = parseFloat(cols[3]);
            const price = parseFloat(cols[4]);
            const fees = cols[5] ? parseFloat(cols[5]) : 0;
            const notes = cols[6] ? cols.slice(6).join(',').trim() : '';

            if (!date || !ticker || !['BUY', 'SELL'].includes(action) || isNaN(quantity) || isNaN(price)) {
                continue;
            }

            trades.push({
                date,
                ticker,
                action: action as 'BUY' | 'SELL',
                quantity,
                price,
                fees,
                notes
            });
        }

        if (trades.length === 0) {
            setError('No valid trades found. Please check the CSV format.');
        } else {
            setParsedTrades(trades);
        }
        setIsParsing(false);
    };

    const handleImport = async () => {
        if (!selectedPortfolioId || parsedTrades.length === 0) return;

        setIsImporting(true);
        setError(null);

        try {
            const response = await fetch('/api/trades/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: selectedPortfolioId,
                    trades: parsedTrades
                })
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessCount(result.count);
                setParsedTrades([]);
                setFile(null);
            } else {
                setError(result.error || 'Failed to import trades');
            }
        } catch (error) {
            setError('An unexpected error occurred during import');
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "Date,Ticker,Action,Quantity,Price,Fees,Notes\n2023-01-15,AAPL,BUY,10,150.50,1.00,Initial Purchase\n2023-02-20,MSFT,SELL,5,280.00,0.50,Taking profits";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stock_portfolio_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Upload size={18} />
                            <span className="text-sm font-bold tracking-wider uppercase">Data Management</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Import Positions</h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Instructions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                                <FileText className="text-primary" size={20} />
                                Guide
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    'Download the template CSV below.',
                                    'Fill with your trade data.',
                                    'Choose your target portfolio.',
                                    'Upload and review transactions.'
                                ].map((step, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-[10px]">
                                            {idx + 1}
                                        </div>
                                        <span className="text-muted-foreground leading-snug">{step}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={downloadTemplate}
                                className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 bg-muted border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-card hover:border-primary/30 transition-all group"
                            >
                                <Download size={16} className="text-primary group-hover:scale-110 transition-transform" />
                                Get Template
                            </button>
                        </div>
                    </div>

                    {/* Main: Import Logic */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border p-8 rounded-[40px] shadow-sm relative overflow-hidden"
                        >
                            {/* Success Notification */}
                            <AnimatePresence>
                                {successCount !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500"
                                    >
                                        <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                            <Check size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-sm text-emerald-600">Import Complete</p>
                                            <p className="text-xs text-emerald-600/70">{successCount} trades added successfully.</p>
                                        </div>
                                        <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest bg-emerald-500 text-white px-4 py-2 rounded-xl">
                                            View
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error Notification */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-500"
                                    >
                                        <AlertCircle size={20} />
                                        <span className="text-sm font-bold">{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-3 block px-1">Select Destination</label>
                                    <select
                                        value={selectedPortfolioId}
                                        onChange={(e) => setSelectedPortfolioId(e.target.value)}
                                        className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                                    >
                                        {portfolios.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-3 block px-1">Source File (.CSV)</label>
                                    <div className="relative group/upload">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full px-6 py-10 bg-muted border-2 border-border border-dashed rounded-[32px] text-muted-foreground flex flex-col items-center justify-center gap-4 group-hover/upload:border-primary/50 group-hover/upload:bg-primary/5 transition-all">
                                            <div className="p-4 bg-card rounded-2xl shadow-sm">
                                                <Upload size={32} className="text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-foreground font-black text-sm">{file ? file.name : "Choose CSV File"}</p>
                                                <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">Drag and drop or browse</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Collapsible */}
                                <AnimatePresence>
                                    {parsedTrades.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="pt-6 border-t border-border/50"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[10px] text-muted-foreground font-black uppercase tracking-widest px-1">
                                                    Processed Preview ({parsedTrades.length} trades)
                                                </h3>
                                            </div>
                                            <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden">
                                                <table className="w-full text-[11px]">
                                                    <thead className="bg-muted">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-black uppercase tracking-tighter text-muted-foreground">Asset</th>
                                                            <th className="px-4 py-3 text-left font-black uppercase tracking-tighter text-muted-foreground">Action</th>
                                                            <th className="px-4 py-3 text-right font-black uppercase tracking-tighter text-muted-foreground">Qty</th>
                                                            <th className="px-4 py-3 text-right font-black uppercase tracking-tighter text-muted-foreground">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/30">
                                                        {parsedTrades.slice(0, 3).map((t, i) => (
                                                            <tr key={i} className="hover:bg-muted/50">
                                                                <td className="px-4 py-3 font-black">{t.ticker}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${t.action === 'BUY' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                                        {t.action}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-muted-foreground">{t.quantity}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-muted-foreground">{t.price}</td>
                                                            </tr>
                                                        ))}
                                                        {parsedTrades.length > 3 && (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground font-bold italic opacity-50">
                                                                    + {parsedTrades.length - 3} more transactions
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="pt-8">
                                    <button
                                        onClick={handleImport}
                                        disabled={isImporting || parsedTrades.length === 0}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={24} />
                                                Confirm Batch Import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
