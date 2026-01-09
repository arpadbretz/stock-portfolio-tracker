'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-all text-foreground group relative overflow-hidden"
            aria-label="Toggle theme"
        >
            <motion.div
                animate={{ y: theme === 'dark' ? 0 : 40 }}
                className="flex flex-col items-center gap-10"
            >
                <Moon size={20} className="text-blue-400" />
                <Sun size={20} className="text-yellow-400" />
            </motion.div>
        </button>
    );
}
