import React, { useState, useMemo, useEffect } from 'react';
import { useRecurringTransactionRepository, useTransactionRepository, useAccountBalanceRepository, useAppState, useAppDispatch, useCategoryRepository, useAccountRepository } from '../../contexts';
import type { RecurringTransaction } from '../../services/database/schemas/RecurringTransaction';
import type { Category } from '../../services/database/schemas/Category';
import type { Account } from '../../services/database/schemas/Account';
import { RecurringTransactionModal } from './RecurringTransactionModal';
import { Modal } from '../ui/Modal';

export const RecurringTransactionsList: React.FC = () => {
    const recurringRepo = useRecurringTransactionRepository();
    const transactionRepo = useTransactionRepository();
    const balanceRepo = useAccountBalanceRepository();
    const categoryRepo = useCategoryRepository();
    const accountRepo = useAccountRepository();
    const dispatch = useAppDispatch();
    const { state, actions } = useAppState();

    const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<RecurringTransaction | null>(null);

    const loadRecurrings = async () => {
        if (!recurringRepo) return;
        try {
            const data = await recurringRepo.findAll();
            setRecurrings(data);
        } catch (err) {
            console.error('[RecurringTransactionsList] Error loading recurrings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecurrings();
    }, [recurringRepo]);

    const handleProcessDue = async () => {
        if (!recurringRepo || !transactionRepo || !balanceRepo) return;
        try {
            const { RecurringTransactionService } = await import('../../services/recurring/RecurringTransactionService');
            const created = await RecurringTransactionService.processDueRecurring(
                recurringRepo,
                transactionRepo,
                balanceRepo
            );
            if (created.length > 0) {
                await actions.loadAllData();
                await loadRecurrings();
            }
        } catch (err) {
            console.error('[RecurringTransactionsList] Error processing due recurrings:', err);
        }
    };

    const handleDelete = async (recurring: RecurringTransaction) => {
        if (!recurringRepo) return;
        try {
            await recurringRepo.delete(recurring.id);
            await loadRecurrings();
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error('[RecurringTransactionsList] Error deleting recurring:', err);
        }
    };

    const handleToggleActive = async (recurring: RecurringTransaction) => {
        if (!recurringRepo) return;
        try {
            await recurringRepo.update(recurring.id, { isActive: !recurring.isActive });
            await loadRecurrings();
        } catch (err) {
            console.error('[RecurringTransactionsList] Error toggling recurring:', err);
        }
    };

    const frequencyLabels: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
    };

    const frequencyIcons: Record<string, string> = {
        daily: '📅',
        weekly: '📆',
        monthly: '🗓️',
        yearly: '🎉',
    };

    const getCategory = (categoryId: number): Category | undefined => {
        return state.categories.find(c => c.id === categoryId);
    };

    const getAccount = (accountId: number): Account | undefined => {
        return state.accounts.find(a => a.id === accountId);
    };

    const isDue = (recurring: RecurringTransaction): boolean => {
        const today = new Date().toISOString().split('T')[0];
        if (!recurring.isActive) return false;
        if (recurring.nextDueDate > today) return false;
        if (recurring.endDate && recurring.nextDueDate > recurring.endDate) return false;
        return true;
    };

    const activeRecurrings = useMemo(() => recurrings.filter(r => r.isActive), [recurrings]);
    const dueRecurrings = useMemo(() => recurrings.filter(r => isDue(r)), [recurrings]);

    if (isLoading) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/30 dark:border-purple-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🔄</span>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recurring Transactions</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activeRecurrings.length} active recurring</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {dueRecurrings.length > 0 && (
                            <button
                                onClick={handleProcessDue}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 transition-all duration-300 flex items-center gap-2"
                            >
                                <span>⚡</span>
                                Process {dueRecurrings.length} Due
                            </button>
                        )}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all duration-300 flex items-center gap-2"
                        >
                            <span>+</span>
                            Add Recurring
                        </button>
                    </div>
                </div>

                {recurrings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="text-4xl mb-2 block">🔄</span>
                        <p>No recurring transactions yet</p>
                        <p className="text-sm mt-1">Create one to automate your regular income and expenses</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recurrings.map(recurring => {
                            const category = getCategory(recurring.categoryId);
                            const account = getAccount(recurring.accountId);
                            const due = isDue(recurring);

                            return (
                                <div
                                    key={recurring.id}
                                    className={`bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 transition-all duration-300 ${
                                        due ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/20' : ''
                                    } ${!recurring.isActive ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                recurring.type === 'income'
                                                    ? 'bg-green-100 dark:bg-green-900/30'
                                                    : 'bg-red-100 dark:bg-red-900/30'
                                            }`}>
                                                <span className={`text-xl ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {recurring.type === 'income' ? '📥' : '📤'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {recurring.description || category?.name || 'Unnamed'}
                                                    </span>
                                                    {!recurring.isActive && (
                                                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                                                            Paused
                                                        </span>
                                                    )}
                                                    {due && recurring.isActive && (
                                                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse">
                                                            Due Today
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{frequencyIcons[recurring.frequency]} {frequencyLabels[recurring.frequency]}</span>
                                                    <span>•</span>
                                                    <span>{category?.icon} {category?.name}</span>
                                                    <span>•</span>
                                                    <span>{account?.icon} {account?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-lg font-bold ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {recurring.type === 'income' ? '+' : '-'}¥{recurring.amount.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Next: {new Date(recurring.nextDueDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleToggleActive(recurring)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        recurring.isActive
                                                            ? 'bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-600 hover:bg-yellow-200/50'
                                                            : 'bg-green-100/50 dark:bg-green-900/30 text-green-600 hover:bg-green-200/50'
                                                    }`}
                                                    title={recurring.isActive ? 'Pause' : 'Activate'}
                                                >
                                                    {recurring.isActive ? '⏸️' : '▶️'}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(recurring)}
                                                    className="p-2 rounded-lg bg-red-100/50 dark:bg-red-900/30 text-red-600 hover:bg-red-200/50 transition-colors"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Recurring Transaction"
            >
                <RecurringTransactionModal
                    accounts={state.accounts}
                    categories={state.categories}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadRecurrings();
                    }}
                    onCancel={() => setShowCreateModal(false)}
                />
            </Modal>

            {showDeleteConfirm && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    title="Delete Recurring Transaction"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            Are you sure you want to delete this recurring transaction?
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {showDeleteConfirm.description || 'Unnamed'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {frequencyLabels[showDeleteConfirm.frequency]} • ¥{showDeleteConfirm.amount.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};