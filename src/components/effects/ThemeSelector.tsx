import { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppStateContext';

interface ThemeOption {
    id: string;
    name: string;
    icon: string;
    gradient: string;
    isUnlocked: boolean;
    unlockCondition: string;
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        id: 'dark',
        name: 'Night Owl',
        icon: '🦉',
        gradient: 'from-gray-900 via-gray-800 to-gray-900',
        isUnlocked: true,
        unlockCondition: 'Default theme',
    },
    {
        id: 'light',
        name: 'Daylight',
        icon: '☀️',
        gradient: 'from-blue-50 via-white to-indigo-50',
        isUnlocked: true,
        unlockCondition: 'Default theme',
    },
    {
        id: 'purple',
        name: 'Mystic Purple',
        icon: '🔮',
        gradient: 'from-purple-900 via-violet-800 to-purple-900',
        isUnlocked: false,
        unlockCondition: 'Unlock 5 achievements',
    },
    {
        id: 'forest',
        name: 'Forest',
        icon: '🌲',
        gradient: 'from-green-900 via-emerald-800 to-green-900',
        isUnlocked: false,
        unlockCondition: 'Create 3 budgets',
    },
    {
        id: 'sunset',
        name: 'Sunset',
        icon: '🌅',
        gradient: 'from-orange-900 via-rose-800 to-yellow-900',
        isUnlocked: false,
        unlockCondition: 'Add 10 transactions',
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: '🌊',
        gradient: 'from-cyan-900 via-blue-800 to-cyan-900',
        isUnlocked: false,
        unlockCondition: 'Create 3 accounts',
    },
];

export default function ThemeSelector() {
    const { state } = useAppState();
    const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['dark', 'light']);
    const [showSelector, setShowSelector] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        const themes = new Set(['dark', 'light']);
        const { achievements } = state as any;
        if (achievements) {
            const count = achievements.filter((a: any) => a.isUnlocked).length;
            if (count >= 5) themes.add('purple');
        }
        const budgetsCount = state.budgets.length;
        if (budgetsCount >= 3) themes.add('forest');
        const transactionsCount = state.transactions.length;
        if (transactionsCount >= 10) themes.add('sunset');
        const accountsCount = state.accounts.length;
        if (accountsCount >= 3) themes.add('ocean');

        setUnlockedThemes(Array.from(themes));
    }, [state]);

    const handleThemeClick = (theme: ThemeOption) => {
        if (!unlockedThemes.includes(theme.id)) {
            setNotification(`🔒 Unlock "${theme.name}" by: ${theme.unlockCondition}`);
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        const event = new CustomEvent('luxury-theme-change', { detail: theme.id });
        window.dispatchEvent(event);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowSelector(!showSelector)}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
                title="Theme Selector"
            >
                🎨
            </button>

            {showSelector && (
                <div className="absolute right-0 top-full mt-2 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 z-50 min-w-64">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Select Theme</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {THEME_OPTIONS.map(theme => {
                            const isUnlocked = unlockedThemes.includes(theme.id);
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => handleThemeClick(theme)}
                                    className={`relative p-3 rounded-xl bg-gradient-to-r ${theme.gradient} border-2 transition-all duration-300 hover:scale-105 ${
                                        !isUnlocked ? 'opacity-50 grayscale' : ''
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{theme.icon}</div>
                                    <div className="text-white text-xs font-medium">{theme.name}</div>
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white text-lg">🔒</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setShowSelector(false)}
                        className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Close
                    </button>
                </div>
            )}

            {notification && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] animate-slide-up">
                    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-2xl border border-white/20">
                        <p className="text-white font-medium">{notification}</p>
                    </div>
                </div>
            )}
        </div>
    );
}