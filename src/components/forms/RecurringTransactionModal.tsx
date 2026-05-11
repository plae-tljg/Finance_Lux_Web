import React, { useState } from 'react';
import { useRecurringTransactionRepository, useTransactionRepository, useAccountBalanceRepository, useAppState, useAppDispatch } from '../../contexts';
import type { Account } from '../../services/database/schemas/Account';
import type { Category } from '../../services/database/schemas/Category';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface RecurringTransactionModalProps {
    accounts: Account[];
    categories: Category[];
    onSuccess: () => void;
    onCancel: () => void;
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({
    accounts,
    categories,
    onSuccess,
    onCancel,
}) => {
    const recurringRepo = useRecurringTransactionRepository();
    const transactionRepo = useTransactionRepository();
    const balanceRepo = useAccountBalanceRepository();
    const dispatch = useAppDispatch();
    const { actions } = useAppState();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [accountId, setAccountId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeAccounts = accounts.filter(a => a.isActive);
    const filteredCategories = categories.filter(c => c.type === type);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recurringRepo || !transactionRepo || !balanceRepo) return;

        setError(null);

        if (!categoryId || !accountId) {
            setError('Please select both category and account');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!startDate) {
            setError('Please select a start date');
            return;
        }

        setIsSubmitting(true);

        try {
            const newRecurring = await recurringRepo.create({
                amount: numAmount,
                categoryId: categoryId as number,
                accountId: accountId as number,
                budgetId: 0,
                description: description || null,
                type,
                frequency,
                startDate,
                endDate: endDate || null,
                nextDueDate: startDate,
                isActive,
            });

            if (startDate === new Date().toISOString().split('T')[0]) {
                await transactionRepo.create({
                    amount: numAmount,
                    categoryId: categoryId as number,
                    accountId: accountId as number,
                    budgetId: 0,
                    description: description || null,
                    date: startDate,
                    type,
                    mood: null,
                    tags: null,
                    sticker: null,
                });

                const latestBal = await balanceRepo.getLatestByAccount(accountId as number);
                const closingBalance = type === 'income'
                    ? (latestBal?.closingBalance ?? 0) + numAmount
                    : (latestBal?.closingBalance ?? 0) - numAmount;

                await balanceRepo.upsert({
                    accountId: accountId as number,
                    year: currentYear,
                    month: currentMonth,
                    openingBalance: latestBal?.closingBalance ?? 0,
                    closingBalance,
                });
            }

            await actions.loadAllData();
            onSuccess();
        } catch (err) {
            console.error('[RecurringTransactionModal] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create recurring transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const frequencyLabels: Record<Frequency, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
    };

    const frequencyIcons: Record<Frequency, string> = {
        daily: '📅',
        weekly: '📆',
        monthly: '🗓️',
        yearly: '🎉',
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                Create Recurring Transaction
            </h3>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => { setType('income'); setCategoryId(''); }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                        type === 'income'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    📥 Income
                </button>
                <button
                    type="button"
                    onClick={() => { setType('expense'); setCategoryId(''); }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                        type === 'expense'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    📤 Expense
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-shake">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Frequency
                        </label>
                        <Select
                            value={frequency}
                            onChange={e => setFrequency(e.target.value as Frequency)}
                            className="w-full"
                        >
                            {(Object.keys(frequencyLabels) as Frequency[]).map(f => (
                                <option key={f} value={f}>
                                    {frequencyIcons[f]} {frequencyLabels[f]}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                    </label>
                    <Select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full"
                    >
                        <option value="">Select category...</option>
                        {filteredCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account
                    </label>
                    <Select
                        value={accountId}
                        onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full"
                    >
                        <option value="">Select account...</option>
                        {activeAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.icon} {account.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (Optional)
                    </label>
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g., Rent payment, Salary..."
                        className="w-full"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date (Optional)
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active (auto-generate transactions)</span>
                </label>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-medium mb-1">How it works</p>
                        <p>A transaction will be automatically created on the specified date. The next due date will be calculated based on the frequency.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    Create Recurring
                </Button>
            </div>
        </form>
    );
};