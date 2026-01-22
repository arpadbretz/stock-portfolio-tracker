'use client';

import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
    Search,
    LayoutDashboard,
    LineChart,
    Bell,
    Calculator,
    Briefcase,
    Upload,
    Settings,
    TrendingUp,
    Eye,
    FileText,
    LogOut,
    Sun,
    Moon,
    Plus,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';

interface SearchResult {
    symbol: string;
    name: string;
    type: string;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const { signOut } = useAuth();
    const { theme, setTheme } = useTheme();

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            // Also support Escape to close
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Search for stocks when query changes
    useEffect(() => {
        const searchStocks = async () => {
            if (search.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                if (supabase) {
                    const { data, error } = await supabase.functions.invoke(`stock-search?q=${encodeURIComponent(search)}`, {
                        method: 'GET'
                    });
                    if (error) throw error;
                    if (data?.results) {
                        setSearchResults(data.results.slice(0, 5));
                    }
                } else {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
                    const data = await res.json();
                    if (data.results) {
                        setSearchResults(data.results.slice(0, 5));
                    }
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchStocks, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const pages = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'main', 'overview'] },
        { name: 'Stock Research', href: '/dashboard/stocks', icon: Search, keywords: ['search', 'find', 'lookup'] },
        { name: 'Watchlist', href: '/dashboard/watchlist', icon: Eye, keywords: ['watch', 'track', 'follow'] },
        { name: 'Price Alerts', href: '/dashboard/alerts', icon: Bell, keywords: ['alert', 'notification', 'price'] },
        { name: 'DCF Calculator', href: '/dashboard/dcf', icon: Calculator, keywords: ['valuation', 'dcf', 'intrinsic'] },
        { name: 'Portfolios', href: '/dashboard/portfolios/manage', icon: Briefcase, keywords: ['portfolio', 'manage'] },
        { name: 'Import Data', href: '/dashboard/import', icon: Upload, keywords: ['import', 'csv', 'upload'] },
        { name: 'Report', href: '/dashboard/report', icon: FileText, keywords: ['report', 'analytics', 'summary'] },
        { name: 'Account Settings', href: '/dashboard/account', icon: Settings, keywords: ['settings', 'account', 'profile'] },
    ];

    const actions = [
        { name: 'Add New Trade', action: () => router.push('/dashboard'), icon: Plus, keywords: ['trade', 'buy', 'sell'] },
        { name: 'Toggle Dark Mode', action: () => setTheme(theme === 'dark' ? 'light' : 'dark'), icon: theme === 'dark' ? Sun : Moon, keywords: ['theme', 'dark', 'light'] },
        { name: 'Sign Out', action: () => signOut(), icon: LogOut, keywords: ['logout', 'sign out', 'exit'] },
    ];

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
                onClick={() => setOpen(false)}
            />

            {/* Command Palette */}
            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh]">
                <Command
                    className="w-full max-w-[640px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    shouldFilter={false}
                >
                    <div className="flex items-center gap-3 px-4 border-b border-border">
                        <Search className="text-muted-foreground shrink-0" size={20} />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search stocks, pages, or actions..."
                            className="w-full py-4 bg-transparent text-foreground font-medium outline-none placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded bg-muted border border-border text-[10px] font-bold text-muted-foreground">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                            {isSearching ? 'Searching...' : 'No results found.'}
                        </Command.Empty>

                        {/* Stock Search Results */}
                        {searchResults.length > 0 && (
                            <Command.Group heading="Stocks">
                                {searchResults.map((stock) => (
                                    <Command.Item
                                        key={stock.symbol}
                                        value={stock.symbol}
                                        onSelect={() => runCommand(() => router.push(`/dashboard/ticker/${stock.symbol}`))}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-muted transition-colors data-[selected=true]:bg-primary/10"
                                    >
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="text-primary" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black">{stock.symbol}</p>
                                            <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground uppercase">{stock.type}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {/* Navigation */}
                        {search.length < 2 && (
                            <>
                                <Command.Group heading="Navigation">
                                    {pages.map((page) => (
                                        <Command.Item
                                            key={page.href}
                                            value={page.name + ' ' + page.keywords.join(' ')}
                                            onSelect={() => runCommand(() => router.push(page.href))}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors data-[selected=true]:bg-primary/10"
                                        >
                                            <page.icon size={18} className="text-muted-foreground" />
                                            <span className="font-bold">{page.name}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>

                                <Command.Group heading="Actions">
                                    {actions.map((action) => (
                                        <Command.Item
                                            key={action.name}
                                            value={action.name + ' ' + action.keywords.join(' ')}
                                            onSelect={() => runCommand(action.action)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors data-[selected=true]:bg-primary/10"
                                        >
                                            <action.icon size={18} className="text-muted-foreground" />
                                            <span className="font-bold">{action.name}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            </>
                        )}
                    </Command.List>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">↵</kbd>
                                Select
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono">⌘K</kbd> anytime
                        </span>
                    </div>
                </Command>
            </div>
        </>
    );
}
