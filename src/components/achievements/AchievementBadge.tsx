import { useEffect, useState } from 'react';
import { useRepositories } from '../../contexts/RepositoryContext';
import type { Achievement } from '../../services/database/schemas/Achievement';

interface AchievementBadgeProps {
    onClick: () => void;
}

export default function AchievementBadge({ onClick }: AchievementBadgeProps) {
    const { achievementRepo, isReady } = useRepositories();
    const [stats, setStats] = useState({ unlocked: 0, total: 0 });
    const [showAnimation, setShowAnimation] = useState(false);
    const [prevUnlocked, setPrevUnlocked] = useState(0);

    useEffect(() => {
        if (!achievementRepo || !isReady) return;

        const loadStats = async () => {
            try {
                const result = await achievementRepo.getStats();
                if (result.unlocked > prevUnlocked && prevUnlocked > 0) {
                    setShowAnimation(true);
                    setTimeout(() => setShowAnimation(false), 2000);
                }
                setPrevUnlocked(stats.unlocked);
                setStats(result);
            } catch (error) {
                console.error('Failed to load achievement stats:', error);
            }
        };

        loadStats();

        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [achievementRepo, isReady, prevUnlocked, stats.unlocked]);

    const percentage = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

    return (
        <button
            onClick={onClick}
            className={`relative group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 ${
                showAnimation ? 'animate-pulse scale-105' : ''
            }`}
        >
            <span className={`text-3xl ${showAnimation ? 'animate-bounce' : ''}`}>🏆</span>
            <div className="text-left">
                <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    {stats.unlocked} / {stats.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage}% Complete
                </div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                View Achievements
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white" />
            </div>
        </button>
    );
}