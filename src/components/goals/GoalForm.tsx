import React, { useState, useEffect } from 'react';
import type { Goal } from '../../services/database/schemas/Goal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface GoalFormProps {
    initialData?: Goal;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CATEGORIES = [
    { value: 'savings', label: '💰 储蓄' },
    { value: 'investment', label: '📈 投资' },
    { value: 'debt', label: '💳 债务' },
    { value: 'purchase', label: '🛒 购物' },
    { value: 'emergency', label: '🛡️ 应急' },
    { value: 'retirement', label: '🏖️ 退休' },
    { value: 'other', label: '📦 其他' },
];

const PRIORITIES = [
    { value: 'low', label: '🟢 低优先级' },
    { value: 'medium', label: '🟡 中优先级' },
    { value: 'high', label: '🔴 高优先级' },
];

const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
    '#10b981', '#06b6d4', '#84cc16', '#f43f5e',
    '#6366f1', '#a855f7', '#14b8a6', '#eab308',
];

const ICONS = [
    '🎯', '💰', '🏠', '🚗', '✈️', '🎮', '📱',
    '💻', '🎓', '💼', '🏖️', '🎁', '🛡️', '📈',
    '🏦', '💳', '🎪', '🏆', '⭐', '🔥', '❤️',
];

export const GoalForm: React.FC<GoalFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>>(
        initialData ? {
            name: initialData.name,
            description: initialData.description || '',
            targetAmount: initialData.targetAmount,
            currentAmount: initialData.currentAmount,
            icon: initialData.icon,
            color: initialData.color,
            deadline: initialData.deadline.split('T')[0],
            category: initialData.category,
            priority: initialData.priority,
            status: initialData.status,
        } : {
            name: '',
            description: '',
            targetAmount: 0,
            currentAmount: 0,
            icon: '🎯',
            color: '#3b82f6',
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: 'savings',
            priority: 'medium',
            status: 'active',
        }
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('请输入目标名称');
            return;
        }
        if (formData.targetAmount <= 0) {
            setError('请输入有效的目标金额');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const goalData = {
                ...formData,
                deadline: formData.deadline,
            };

            const event = new CustomEvent('goalFormSubmit', { detail: goalData });
            window.dispatchEvent(event);

            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : '提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        目标名称
                    </label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="例如：旅行基金"
                        className="w-full"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        描述（可选）
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="描述你的目标..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        目标金额
                    </label>
                    <Input
                        type="number"
                        value={formData.targetAmount || ''}
                        onChange={e => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        已存金额
                    </label>
                    <Input
                        type="number"
                        value={formData.currentAmount || ''}
                        onChange={e => setFormData(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        截止日期
                    </label>
                    <Input
                        type="date"
                        value={formData.deadline}
                        onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        类别
                    </label>
                    <Select
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
                        options={CATEGORIES}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        优先级
                    </label>
                    <Select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
                        options={PRIORITIES}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        图标
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50">
                        {ICONS.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
                                    formData.icon === icon
                                        ? 'bg-blue-500 text-white shadow-md scale-110'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        颜色
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                className={`w-8 h-8 rounded-lg transition-all ${
                                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="secondary"
                    className="flex-1"
                    disabled={isSubmitting}
                >
                    取消
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '提交中...' : isEditing ? '保存' : '创建目标'}
                </Button>
            </div>
        </form>
    );
};