import React, { useState } from 'react';
import { useTransferRepository, useAccountBalanceRepository, useAppState, useAppDispatch } from '../../contexts';
import type { Account } from '../../services/database/schemas/Account';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface TransferModalProps {
    accounts: Account[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    accounts,
    onSuccess,
    onCancel,
}) => {
    const transferRepo = useTransferRepository();
    const balanceRepo = useAccountBalanceRepository();
    const dispatch = useAppDispatch();
    const { actions } = useAppState();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [fromAccountId, setFromAccountId] = useState<number | ''>('');
    const [toAccountId, setToAccountId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeAccounts = accounts.filter(a => a.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferRepo || !balanceRepo) return;

        setError(null);

        if (!fromAccountId || !toAccountId) {
            setError('Please select both source and destination accounts');
            return;
        }

        if (fromAccountId === toAccountId) {
            setError('Source and destination accounts must be different');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);

        try {
            await transferRepo.create({
                fromAccountId: fromAccountId as number,
                toAccountId: toAccountId as number,
                amount: numAmount,
                description: description || null,
                date,
            });

            const fromBal = await balanceRepo.getLatestByAccount(fromAccountId as number);
            const toBal = await balanceRepo.getLatestByAccount(toAccountId as number);

            await balanceRepo.upsert({
                accountId: fromAccountId as number,
                year: currentYear,
                month: currentMonth,
                openingBalance: fromBal?.closingBalance ?? 0,
                closingBalance: (fromBal?.closingBalance ?? 0) - numAmount,
            });

            await balanceRepo.upsert({
                accountId: toAccountId as number,
                year: currentYear,
                month: currentMonth,
                openingBalance: toBal?.closingBalance ?? 0,
                closingBalance: (toBal?.closingBalance ?? 0) + numAmount,
            });

            await actions.loadAllData();
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                💸 Transfer Between Accounts
            </h3>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From Account
                    </label>
                    <Select
                        value={fromAccountId}
                        onChange={e => setFromAccountId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full"
                    >
                        <option value="">Select source account...</option>
                        {activeAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.icon} {account.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="flex justify-center">
                    <div className="text-2xl text-gray-400">↓</div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        To Account
                    </label>
                    <Select
                        value={toAccountId}
                        onChange={e => setToAccountId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full"
                    >
                        <option value="">Select destination account...</option>
                        {activeAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.icon} {account.name}
                            </option>
                        ))}
                    </Select>
                </div>

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
                        placeholder="Enter amount..."
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (Optional)
                    </label>
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g., Reimbursement, Bill payment..."
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                    </label>
                    <Input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    Transfer
                </Button>
            </div>
        </form>
    );
};