import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { GoalCard, GoalCardSkeleton } from './GoalCard';
import { GoalForm } from './GoalForm';
import type { Goal } from '../../services/database/schemas/Goal';
import { goalService } from '../../services/goal/GoalService';

interface GoalsPageProps {
    goals: Goal[];
    onGoalCreate: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => Promise<void>;
    onGoalUpdate: (id: number, data: Partial<Goal>) => Promise<void>;
    onGoalDelete: (id: number) => Promise<void>;
    onGoalContribute: (id: number, amount: number) => Promise<void>;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
    goals,
    onGoalCreate,
    onGoalUpdate,
    onGoalDelete,
    onGoalContribute,
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
    const [filterCategory, setFilterCategory] = useState<Goal['category'] | 'all'>('all');
    const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'priority'>('deadline');
    const [searchText, setSearchText] = useState('');

    const filteredGoals = useMemo(() => {
        let result = [...goals];

        if (filterStatus !== 'all') {
            result = result.filter(g => g.status === filterStatus);
        }

        if (filterCategory !== 'all') {
            result = result.filter(g => g.category === filterCategory);
        }

        if (searchText) {
            const search = searchText.toLowerCase();
            result = result.filter(g =>
                g.name.toLowerCase().includes(search) ||
                g.description?.toLowerCase().includes(search)
            );
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'deadline':
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                case 'progress':
                    const progressA = goalService.calculateProgress(a);
                    const progressB = goalService.calculateProgress(b);
                    return progressB - progressA;
                case 'priority': {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                default:
                    return 0;
            }
        });

        return result;
    }, [goals, filterStatus, filterCategory, sortBy, searchText]);

    const stats = useMemo(() => {
        const active = goals.filter(g => g.status === 'active');
        const completed = goals.filter(g => g.status === 'completed');
        const totalTarget = active.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalCurrent = active.reduce((sum, g) => sum + g.currentAmount, 0);
        const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

        return {
            total: goals.length,
            active: active.length,
            completed: completed.length,
            totalTarget,
            totalCurrent,
            overallProgress,
        };
    }, [goals]);

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setShowEditModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('确定要删除这个目标吗？')) {
            await onGoalDelete(id);
        }
    };

    const handleAddContribution = async (id: number, amount: number) => {
        await onGoalContribute(id, amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    财务目标
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    + 创建目标
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">进行中</div>
                    <div className="text-2xl font-bold text-purple-500 group-hover:scale-105 transition-transform">{stats.active}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">已完成</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">{stats.completed}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">总目标</div>
                    <div className="text-2xl font-bold text-blue-500 group-hover:scale-105 transition-transform">¥{stats.totalTarget.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">总进度</div>
                    <div className="text-2xl font-bold text-emerald-500 group-hover:scale-105 transition-transform">{stats.overallProgress}%</div>
                    <div className="mt-2 h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${stats.overallProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">搜索</label>
                        <input
                            type="text"
                            placeholder="搜索目标..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">状态</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        >
                            <option value="all">全部</option>
                            <option value="active">进行中</option>
                            <option value="completed">已完成</option>
                            <option value="paused">已暂停</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">类别</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as Goal['category'] | 'all')}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        >
                            <option value="all">全部</option>
                            <option value="savings">💰 储蓄</option>
                            <option value="investment">📈 投资</option>
                            <option value="debt">💳 债务</option>
                            <option value="purchase">🛒 购物</option>
                            <option value="emergency">🛡️ 应急</option>
                            <option value="retirement">🏖️ 退休</option>
                            <option value="other">📦 其他</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">排序</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as typeof sortBy)}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        >
                            <option value="deadline">按截止日期</option>
                            <option value="progress">按进度</option>
                            <option value="priority">按优先级</option>
                        </select>
                    </div>
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">还没有财务目标</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">创建你的第一个财务目标，开始存钱之旅！</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all"
                    >
                        + 创建第一个目标
                    </button>
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-12 text-center text-gray-500 dark:text-gray-400">
                    没有匹配的目标
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAddContribution={handleAddContribution}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="创建财务目标"
            >
                <GoalForm
                    onSuccess={() => setShowAddModal(false)}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingGoal(null);
                }}
                title="编辑目标"
            >
                {editingGoal && (
                    <GoalForm
                        initialData={editingGoal}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingGoal(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingGoal(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};