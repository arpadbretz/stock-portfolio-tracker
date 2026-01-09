'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Settings, Check, Folder } from 'lucide-react';
import Link from 'next/link';

interface Portfolio {
    id: string;
    name: string;
    description: string | null;
    color: string;
    created_at: string;
}

interface PortfolioSwitcherProps {
    currentPortfolioId: string;
    onPortfolioChange: (portfolioId: string) => void;
}

export default function PortfolioSwitcher({ currentPortfolioId, onPortfolioChange }: PortfolioSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const currentPortfolio = portfolios.find(p => p.id === currentPortfolioId);

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/portfolios');
            if (response.ok) {
                const data = await response.json();
                setPortfolios(data.portfolios || []);
            }
        } catch (error) {
            console.error('Error fetching portfolios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePortfolio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) return;

        try {
            setIsCreating(true);
            const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPortfolioName.trim(),
                    description: '',
                    color: '#10b981'
                })
            });

            if (response.ok) {
                const { portfolio } = await response.json();
                setPortfolios([...portfolios, portfolio]);
                setNewPortfolioName('');
                setShowCreateForm(false);
                onPortfolioChange(portfolio.id);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error creating portfolio:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSetDefault = async (portfolioId: string) => {
        try {
            await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId,
                    setAsDefault: true
                })
            });
        } catch (error) {
            console.error('Error setting default portfolio:', error);
        }
    };

    const handleSwitchPortfolio = (portfolioId: string) => {
        onPortfolioChange(portfolioId);
        handleSetDefault(portfolioId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-all"
            >
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentPortfolio?.color || '#10b981' }}
                />
                <span className="text-white font-semibold max-w-[150px] truncate">
                    {currentPortfolio?.name || 'Select Portfolio'}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                            setIsOpen(false);
                            setShowCreateForm(false);
                        }}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
                        <div className="p-3 border-b border-slate-700">
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                                Your Portfolios
                            </p>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center text-slate-400">
                                    Loading...
                                </div>
                            ) : portfolios.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    No portfolios found
                                </div>
                            ) : (
                                portfolios.map((portfolio) => (
                                    <button
                                        key={portfolio.id}
                                        onClick={() => handleSwitchPortfolio(portfolio.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors ${portfolio.id === currentPortfolioId ? 'bg-slate-700/50' : ''
                                            }`}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: portfolio.color }}
                                        />
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-white font-medium truncate">{portfolio.name}</p>
                                            {portfolio.description && (
                                                <p className="text-xs text-slate-400 truncate">{portfolio.description}</p>
                                            )}
                                        </div>
                                        {portfolio.id === currentPortfolioId && (
                                            <Check size={16} className="text-emerald-400 flex-shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="border-t border-slate-700">
                            {showCreateForm ? (
                                <form onSubmit={handleCreatePortfolio} className="p-3">
                                    <input
                                        type="text"
                                        value={newPortfolioName}
                                        onChange={(e) => setNewPortfolioName(e.target.value)}
                                        placeholder="Portfolio name..."
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                                        autoFocus
                                        disabled={isCreating}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={!newPortfolioName.trim() || isCreating}
                                            className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {isCreating ? 'Creating...' : 'Create'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setNewPortfolioName('');
                                            }}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                                            disabled={isCreating}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-emerald-400"
                                    >
                                        <Plus size={18} />
                                        <span className="font-medium">New Portfolio</span>
                                    </button>
                                    <Link
                                        href="/portfolios/manage"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-slate-300 border-t border-slate-700"
                                    >
                                        <Settings size={18} />
                                        <span className="font-medium">Manage Portfolios</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
