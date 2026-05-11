import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, useGoalRepository } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { GoalForm } from '../components/goals/GoalForm';
import { goalService } from '../services/goal/GoalService';
import type { Goal } from '../services/database/schemas/Goal';

export default function Goals() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const goalRepo = useGoalRepository();
    const { goals } = state;

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (goalRepo) {
            goalService.setGoalRepo(goalRepo);
        }
    }, [goalRepo]);

    const handleGoalCreate = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => {
        if (!goalRepo) return;

        const id = await goalRepo.insert(data);
        const newGoal = await goalRepo.findById(id);
        if (newGoal) {
            dispatch({ type: 'ADD_GOAL', payload: newGoal });
        }
    };

    const handleGoalUpdate = async (id: number, data: Partial<Goal>) => {
        if (!goalRepo) return;

        await goalRepo.update(id, data);
        const updatedGoal = await goalRepo.findById(id);
        if (updatedGoal) {
            dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
        }
    };

    const handleGoalDelete = async (id: number) => {
        if (!goalRepo) return;

        await goalRepo.delete(id);
        dispatch({ type: 'DELETE_GOAL', payload: id });
    };

    const handleGoalContribute = async (id: number, amount: number) => {
        if (!goalRepo) return;

        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const newAmount = goal.currentAmount + amount;
        await goalRepo.updateProgress(id, newAmount);
        const updatedGoal = await goalRepo.findById(id);
        if (updatedGoal) {
            dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
        }
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
                {[
                    { label: '进行中', value: goals.filter(g => g.status === 'active').length, color: 'purple' },
                    { label: '已完成', value: goals.filter(g => g.status === 'completed').length, color: 'green' },
                    { label: '总目标', value: `¥${goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}`, color: 'blue' },
                    { label: '已存', value: `¥${goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}`, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                        <div className={`text-2xl font-bold text-${stat.color}-500 group-hover:scale-105 transition-transform`}>{stat.value}</div>
                    </div>
                ))}
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
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <div
                            key={goal.id}
                            className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-${goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'yellow' : 'blue'}-400/30 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${goal.status === 'completed' ? 'ring-2 ring-green-500/50' : ''}`}
                        >
                            {goal.status === 'completed' && (
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
                                                {goal.category === 'savings' ? '💰 储蓄' :
                                                 goal.category === 'investment' ? '📈 投资' :
                                                 goal.category === 'debt' ? '💳 债务' :
                                                 goal.category === 'purchase' ? '🛒 购物' :
                                                 goal.category === 'emergency' ? '🛡️ 应急' :
                                                 goal.category === 'retirement' ? '🏖️ 退休' : '📦 其他'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingGoal(goal);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('确定要删除这个目标吗？')) {
                                                    await handleGoalDelete(goal.id);
                                                }
                                            }}
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
                                                width: `${goalService.calculateProgress(goal)}%`,
                                                backgroundColor: goal.status === 'completed' ? '#10b981' : goal.color,
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className={`font-medium ${goalService.isOnTrack(goal) ? 'text-green-500' : 'text-orange-500'}`}>
                                            {goalService.calculateProgress(goal)}% 完成
                                        </span>
                                        <span className={`${goalService.getDaysRemaining(goal) <= 7 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {goalService.getDaysRemaining(goal) === 0 ? '已到期' : `${goalService.getDaysRemaining(goal)} 天后到期`}
                                        </span>
                                    </div>
                                </div>

                                {goal.status !== 'completed' && (
                                    <button
                                        onClick={async () => {
                                            const amount = parseFloat(prompt('请输入存入金额：') || '0');
                                            if (amount > 0) {
                                                await handleGoalContribute(goal.id, amount);
                                            }
                                        }}
                                        className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        💰 存入资金
                                    </button>
                                )}
                            </div>
                        </div>
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
}