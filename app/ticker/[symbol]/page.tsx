export default function TickerPage({ params }: { params: { symbol: string } }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
            <h1 className="text-4xl font-bold text-white mb-4">Stock Research: {params.symbol.toUpperCase()}</h1>
            <p className="text-slate-400">Detailed analytics for {params.symbol} coming soon.</p>
        </div>
    );
}
