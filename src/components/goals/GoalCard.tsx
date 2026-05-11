import React, { useState } from 'react';
import type { Goal } from '../../services/database/schemas/Goal';
import { goalService } from '../../services/goal/GoalService';

interface GoalCardProps {
    goal: Goal;
    onEdit?: (goal: Goal) => void;
    onDelete?: (id: number) => void;
    onAddContribution?: (id: number, amount: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onAddContribution }) => {
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [contributeAmount, setContributeAmount] = useState('');

    const progress = goalService.calculateProgress(goal);
    const daysRemaining = goalService.getDaysRemaining(goal);
    const isOnTrack = goalService.isOnTrack(goal);
    const isCompleted = goal.status === 'completed';

    const priorityColors = {
        low: 'border-blue-400/30',
        medium: 'border-yellow-400/30',
        high: 'border-red-400/30',
    };

    const categoryLabels = {
        savings: '储蓄',
        investment: '投资',
        debt: '债务',
        purchase: '购物',
        emergency: '应急',
        retirement: '退休',
        other: '其他',
    };

    const handleContribute = () => {
        const amount = parseFloat(contributeAmount);
        if (amount > 0 && onAddContribution) {
            onAddContribution(goal.id, amount);
            setShowContributeModal(false);
            setContributeAmount('');
        }
    };

    return (
        <>
            <div
                className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border ${priorityColors[goal.priority]} overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${
                    isCompleted ? 'ring-2 ring-green-500/50' : ''
                }`}
            >
                {isCompleted && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-1 text-sm font-medium z-10">
                        ✨ 已完成
                    </div>
                )}

                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                                style={{ backgroundColor: `${goal.color}20` }}
                            >
                                {goal.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">
                                    {goal.name}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {categoryLabels[goal.category]}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit?.(goal)}
                                className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => onDelete?.(goal.id)}
                                className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {goal.description}
                        </p>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                                ¥{goal.currentAmount.toLocaleString()}
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                ¥{goal.targetAmount.toLocaleString()}
                            </span>
                        </div>

                        <div className="relative h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: isCompleted ? '#10b981' : goal.color,
                                }}
                            />
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                                style={{ backgroundSize: '200% 100%' }}
                            />
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className={`font-medium ${isOnTrack ? 'text-green-500' : 'text-orange-500'}`}>
                                {progress}% 完成
                            </span>
                            <span className={`${daysRemaining <= 7 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                {daysRemaining === 0 ? '已到期' : `${daysRemaining} 天后到期`}
                            </span>
                        </div>
                    </div>

                    {!isCompleted && (
                        <button
                            onClick={() => setShowContributeModal(true)}
                            className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            💰 存入资金
                        </button>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {showContributeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-80 m-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            为「{goal.name}」存入资金
                        </h3>
                        <div className="mb-4">
                            <input
                                type="number"
                                value={contributeAmount}
                                onChange={e => setContributeAmount(e.target.value)}
                                placeholder="输入金额"
                                className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowContributeModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleContribute}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-colors"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const GoalCardSkeleton: React.FC = () => (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 animate-pulse">
        <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl" />
            <div className="flex-1">
                <div className="h-5 bg-gray-200/50 dark:bg-gray-700/50 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded w-16" />
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded w-full" />
            <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded w-3/4" />
            <div className="h-8 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl w-full mt-4" />
        </div>
    </div>
);