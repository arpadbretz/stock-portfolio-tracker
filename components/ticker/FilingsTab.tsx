'use client';

import { motion } from 'framer-motion';
import {
    Newspaper,
    FileCheck,
    ExternalLink,
    UserCheck,
    Briefcase,
    TrendingDownIcon,
} from 'lucide-react';

interface FilingsTabProps {
    stock: any;
    news: any;
    insiders: any;
    institutions: any;
    filings: any;
    formatLargeNumber: (num: number) => string;
}

export default function FilingsTab({
    stock,
    news,
    insiders,
    institutions,
    filings,
    formatLargeNumber,
}: FilingsTabProps) {
    return (
        <div className="space-y-8">
            {/* News Feed */}
            {news && news.news && news.news.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Newspaper className="text-blue-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">Latest News</h3>
                    </div>

                    <div className="space-y-4">
                        {news.news.slice(0, 15).map((item: any, idx: number) => (
                            <a
                                key={item.uuid || idx}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex gap-4">
                                    {item.thumbnail && (
                                        <img
                                            src={item.thumbnail}
                                            alt=""
                                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="font-bold">{item.publisher}</span>
                                            {item.providerPublishTime && (
                                                <>
                                                    <span>•</span>
                                                    <span>{new Date(item.providerPublishTime).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                </div>
                            </a>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* SEC Filings */}
            {filings && filings.filings && filings.filings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <FileCheck className="text-green-500" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">SEC Filings</h3>
                            <p className="text-sm text-muted-foreground mt-1">CIK: {filings.cik}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filings.filings.slice(0, 15).map((filing: any, idx: number) => (
                            <a
                                key={idx}
                                href={filing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1 rounded-lg text-xs font-black ${filing.form === '10-K' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                        filing.form === '10-Q' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                            filing.form === '8-K' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                        {filing.form}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-primary transition-colors">
                                            {filing.description || filing.form}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Filed: {new Date(filing.filingDate).toLocaleDateString()}
                                            {filing.reportDate && ` • Report: ${new Date(filing.reportDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Insider Trading */}
            {insiders && insiders.transactions && insiders.transactions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <UserCheck className="text-purple-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">Insider Trading Activity</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Insider</th>
                                    <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Transaction</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Shares</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Value</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {insiders.transactions.slice(0, 15).map((txn: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-xs">{txn.filerName}</div>
                                            <div className="text-[10px] text-muted-foreground">{txn.filerRelation}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs">{txn.transactionText}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                                            {txn.shares ? txn.shares.toLocaleString() : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                                            {txn.moneyText || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                            {txn.startDate ? new Date(txn.startDate).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Institutional Ownership */}
            {institutions && institutions.institutions && institutions.institutions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <Briefcase className="text-indigo-500" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black">Institutional Ownership</h3>
                            {institutions.breakdown && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {institutions.breakdown.institutionsPercentHeld
                                        ? `${(institutions.breakdown.institutionsPercentHeld * 100).toFixed(1)}% held by ${institutions.breakdown.institutionsCount || 0} institutions`
                                        : 'Ownership data available'
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Institution</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Shares</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">% Held</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Value</th>
                                    <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {institutions.institutions.slice(0, 20).map((inst: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 font-bold">{inst.organization}</td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                                            {inst.position ? inst.position.toLocaleString() : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                                            {inst.pctHeld ? `${(inst.pctHeld * 100).toFixed(2)}%` : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                                            {inst.value ? formatLargeNumber(inst.value) : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                            {inst.reportDate ? new Date(inst.reportDate).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Short Interest */}
            {stock && (stock.shortRatio || stock.shortPercentOfFloat) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-rose-500/10 rounded-2xl">
                            <TrendingDownIcon className="text-rose-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">Short Interest</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stock.shortRatio && (
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Days to Cover</p>
                                <p className="text-2xl font-black">{stock.shortRatio.toFixed(2)}</p>
                            </div>
                        )}
                        {stock.shortPercentOfFloat && (
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">% of Float</p>
                                <p className="text-2xl font-black">{(stock.shortPercentOfFloat * 100).toFixed(2)}%</p>
                            </div>
                        )}
                        {stock.sharesShort && (
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Shares Short</p>
                                <p className="text-2xl font-black">{(stock.sharesShort / 1e6).toFixed(2)}M</p>
                            </div>
                        )}
                        {stock.sharesShortPriorMonth && (
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Prior Month</p>
                                <p className="text-2xl font-black">{(stock.sharesShortPriorMonth / 1e6).toFixed(2)}M</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
