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
    Loader2
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

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
    const { user, loading: authLoading } = useAuth();
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

        // Simple parser assuming strict format: 
        // Date,Ticker,Action,Quantity,Price,Fees,Notes
        // Skip header if present (check if first col is 'Date')

        const startIndex = lines[0].toLowerCase().startsWith('date') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            if (cols.length < 5) continue; // Minimum required

            const date = cols[0].trim();
            const ticker = cols[1].trim();
            const action = cols[2].trim().toUpperCase();
            const quantity = parseFloat(cols[3]);
            const price = parseFloat(cols[4]);
            const fees = cols[5] ? parseFloat(cols[5]) : 0;
            const notes = cols[6] ? cols.slice(6).join(',').trim() : '';

            if (!date || !ticker || !['BUY', 'SELL'].includes(action) || isNaN(quantity) || isNaN(price)) {
                // Invalid row
                console.warn(`Skipping invalid row ${i + 1}: ${line}`);
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
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Import Trades</h1>
                </div>

                <div className="grid gap-8">
                    {/* Instructions */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
                        <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
                            <li>Download the CSV template below.</li>
                            <li>Fill in your trade data following the strict format.</li>
                            <li>Select the target portfolio.</li>
                            <li>Upload user file and review the preview.</li>
                            <li>Click "Import Trades" to process.</li>
                        </ol>
                        <button
                            onClick={downloadTemplate}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
                        >
                            <FileText size={16} />
                            Download Template
                        </button>
                    </div>

                    {/* Import Area */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                        {/* Status Messages */}
                        {successCount !== null && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                                <Check size={20} />
                                <span>Successfully imported {successCount} trades!</span>
                                <Link href="/" className="ml-auto underline text-sm">View Dashboard</Link>
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Target Portfolio</label>
                                <select
                                    value={selectedPortfolioId}
                                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {portfolios.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Upload CSV</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-full px-4 py-3 bg-slate-900 border border-slate-600 border-dashed rounded-xl text-slate-400 flex items-center gap-2 hover:bg-slate-900/80 transition-colors">
                                        <Upload size={20} />
                                        <span className="truncate">{file ? file.name : "Click to select CSV file..."}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        {parsedTrades.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                                    Preview ({parsedTrades.length} trades)
                                </h3>
                                <div className="border border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-400">Ticker</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-400">Action</th>
                                                <th className="px-4 py-3 text-right font-medium text-slate-400">Qty</th>
                                                <th className="px-4 py-3 text-right font-medium text-slate-400">Price</th>
                                                <th className="px-4 py-3 text-right font-medium text-slate-400">Fees</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {parsedTrades.slice(0, 5).map((t, i) => (
                                                <tr key={i} className="hover:bg-slate-700/20">
                                                    <td className="px-4 py-2 text-white">{t.date}</td>
                                                    <td className="px-4 py-2 text-white font-medium">{t.ticker}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {t.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-300">{t.quantity}</td>
                                                    <td className="px-4 py-2 text-right text-slate-300">{t.price}</td>
                                                    <td className="px-4 py-2 text-right text-slate-300">{t.fees}</td>
                                                </tr>
                                            ))}
                                            {parsedTrades.length > 5 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-3 text-center text-slate-500 italic">
                                                        ...and {parsedTrades.length - 5} more
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleImport}
                                disabled={isImporting || parsedTrades.length === 0}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Check size={24} />
                                        Import {parsedTrades.length} Trades
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
