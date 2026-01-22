'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { trackTickerSearch } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

interface SearchResult {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
}

interface TickerSearchProps {
    onSelect: (result: SearchResult) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    initialValue?: string;
}

export default function TickerSearch({
    onSelect,
    placeholder = 'Search by ticker or company name...',
    className = '',
    inputClassName = '',
    initialValue = ''
}: TickerSearchProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const hasSelectedRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Skip search if user just selected a result
        if (hasSelectedRef.current) {
            hasSelectedRef.current = false;
            return;
        }

        const searchStocks = async () => {
            if (query.length < 1) {
                setResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            setShowResults(true);

            // Track search
            trackTickerSearch(query, user?.id || null);

            try {
                // Use Supabase Edge Function for search (lower latency, no cold start)
                if (supabase) {
                    const { data, error } = await supabase.functions.invoke(`stock-search?q=${encodeURIComponent(query)}`, {
                        method: 'GET'
                    });

                    if (error) throw error;
                    setResults(data.results || []);
                } else {
                    // Fallback to local API
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    setResults(data.results || []);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchStocks, 300);
        return () => clearTimeout(debounce);
    }, [query, user?.id]);

    const handleSelect = (result: SearchResult) => {
        hasSelectedRef.current = true;
        setQuery(result.symbol);
        setResults([]);
        setShowResults(false);
        onSelect(result);
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder={placeholder}
                    className={`w-full pl-12 pr-10 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${inputClassName}`}
                />
                {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showResults && (results.length > 0 || isSearching) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[300px] overflow-y-auto"
                    >
                        {isSearching && results.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Searching for "{query}"...
                            </div>
                        )}
                        {results.map((result) => (
                            <button
                                key={result.symbol}
                                type="button"
                                onClick={() => handleSelect(result)}
                                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center font-black text-primary text-[10px]">
                                        {result.symbol.slice(0, 3)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                            {result.symbol}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {result.exchange}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {result.name}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
