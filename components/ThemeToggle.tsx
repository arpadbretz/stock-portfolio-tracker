'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-16 h-8 rounded-full bg-muted/50 border border-border/50 p-1 flex items-center shadow-inner cursor-pointer"
            aria-label="Toggle theme"
        >
            <motion.div
                className="absolute w-6 h-6 rounded-full bg-card shadow-lg flex items-center justify-center border border-border/30"
                initial={false}
                animate={{
                    x: theme === 'dark' ? 32 : 0,
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                {theme === 'dark' ? (
                    <Moon size={14} className="text-blue-400" />
                ) : (
                    <Sun size={14} className="text-amber-500" />
                )}
            </motion.div>
            <div className="flex justify-between w-full px-2 pointer-events-none opacity-20">
                <Sun size={12} className="text-amber-500" />
                <Moon size={12} className="text-blue-400" />
            </div>
        </button>
    );
}
