import { useState, useEffect, useCallback } from 'react';
import { useRepositories } from '../../contexts/RepositoryContext';
import type { Achievement } from '../../services/database/schemas/Achievement';

interface AchievementsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const categoryColors: Record<string, { bg: string; border: string; badge: string }> = {
    transactions: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', badge: 'bg-blue-500' },
    budgets: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', badge: 'bg-green-500' },
    accounts: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', badge: 'bg-purple-500' },
    consistency: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30', badge: 'bg-orange-500' },
    social: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-500/30', badge: 'bg-pink-500' },
    special: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30', badge: 'bg-yellow-500' },
};

const categoryNames: Record<string, string> = {
    transactions: 'Transactions',
    budgets: 'Budgets',
    accounts: 'Accounts',
    consistency: 'Consistency',
    social: 'Social',
    special: 'Special',
};

export default function AchievementsPanel({ isOpen, onClose }: AchievementsPanelProps) {
    const { achievementRepo, isReady } = useRepositories();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

    const loadAchievements = useCallback(async () => {
        if (!achievementRepo || !isReady) return;
        setLoading(true);
        try {
            const data = await achievementRepo.findAll();
            setAchievements(data);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    }, [achievementRepo, isReady]);

    useEffect(() => {
        if (isOpen) {
            loadAchievements();
        }
    }, [isOpen, loadAchievements]);

    const filteredAchievements = achievements.filter(a => {
        if (filter === 'unlocked') return a.isUnlocked;
        if (filter === 'locked') return !a.isUnlocked;
        return true;
    });

    const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>);

    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalCount = achievements.length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/20 dark:border-gray-700/30">
                <div className="sticky top-0 z-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-b border-yellow-500/20 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl animate-bounce">🏆</span>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                    Achievements
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {unlockedCount} of {totalCount} unlocked
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {(['all', 'unlocked', 'locked'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    filter === f
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(85vh-160px)] p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedAchievements).map(([category, items]) => {
                                const colors = categoryColors[category] || categoryColors.special;
                                return (
                                    <div key={category}>
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${colors.badge}`} />
                                            {categoryNames[category] || category}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {items.map(achievement => (
                                                <div
                                                    key={achievement.id}
                                                    className={`relative p-4 rounded-2xl border transition-all duration-500 ${
                                                        achievement.isUnlocked
                                                            ? `bg-gradient-to-br ${colors.bg} border-${colors.border} opacity-100`
                                                            : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200/30 dark:border-gray-700/30 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`text-4xl p-2 rounded-xl ${
                                                            achievement.isUnlocked
                                                                ? 'bg-white/50 dark:bg-gray-800/50 shadow-lg'
                                                                : 'grayscale'
                                                        }`}>
                                                            {achievement.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-semibold ${
                                                                    achievement.isUnlocked
                                                                        ? 'text-gray-800 dark:text-white'
                                                                        : 'text-gray-500 dark:text-gray-400'
                                                                }`}>
                                                                    {achievement.name}
                                                                </h4>
                                                                {achievement.isUnlocked && (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                                                                        Unlocked
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                {achievement.description}
                                                            </p>
                                                            {!achievement.isUnlocked && (
                                                                <div className="mt-2">
                                                                    <div className="h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                                achievement.progress >= achievement.requirement * 0.8
                                                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                                            }`}
                                                                            style={{ width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                        {achievement.progress} / {achievement.requirement}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {achievement.isUnlocked && achievement.unlockedAt && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}