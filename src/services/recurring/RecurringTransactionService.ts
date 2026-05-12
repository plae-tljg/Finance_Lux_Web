import { useRecurringTransactionRepository, useTransactionRepository, useAccountBalanceRepository } from '../../contexts';
import type { RecurringTransaction } from '../database/schemas/RecurringTransaction';
import type { Transaction } from '../database/schemas/Transaction';

export interface RecurringTransactionWithDetails extends RecurringTransaction {
    categoryName?: string;
    categoryIcon?: string;
    accountName?: string;
    accountIcon?: string;
}

export class RecurringTransactionService {
    static calculateNextDueDate(currentDueDate: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
        const date = new Date(currentDueDate);
        switch (frequency) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString().split('T')[0];
    }

    static isDue(recurring: RecurringTransaction, checkDate: string = new Date().toISOString().split('T')[0]): boolean {
        if (!recurring.isActive) return false;
        if (recurring.nextDueDate > checkDate) return false;
        if (recurring.endDate && recurring.nextDueDate > recurring.endDate) return false;
        return true;
    }

    static async processDueRecurring(
        recurringRepo: ReturnType<typeof useRecurringTransactionRepository>,
        transactionRepo: ReturnType<typeof useTransactionRepository>,
        balanceRepo: ReturnType<typeof useAccountBalanceRepository>
    ): Promise<Transaction[]> {
        if (!recurringRepo || !transactionRepo || !balanceRepo) {
            return [];
        }

        const today = new Date().toISOString().split('T')[0];
        const dueRecurrings = await recurringRepo.findDueBefore(today);
        const createdTransactions: Transaction[] = [];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        for (const recurring of dueRecurrings) {
            try {
                const newTransaction = await transactionRepo.create({
                    amount: recurring.amount,
                    categoryId: recurring.categoryId,
                    accountId: recurring.accountId,
                    budgetId: recurring.budgetId,
                    description: recurring.description,
                    date: recurring.nextDueDate,
                    type: recurring.type,
                    mood: null,
                    tags: null,
                    sticker: null,
                });
                createdTransactions.push(newTransaction);

                const latestBal = await balanceRepo.getLatestByAccount(recurring.accountId);
                const closingBalance = recurring.type === 'income'
                    ? (latestBal?.closingBalance ?? 0) + recurring.amount
                    : (latestBal?.closingBalance ?? 0) - recurring.amount;

                await balanceRepo.upsert({
                    accountId: recurring.accountId,
                    year: currentYear,
                    month: currentMonth,
                    openingBalance: latestBal?.closingBalance ?? 0,
                    closingBalance,
                });

                const nextDueDate = this.calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

                if (recurring.endDate && nextDueDate > recurring.endDate) {
                    await recurringRepo.setInactive(recurring.id);
                } else {
                    await recurringRepo.updateNextDueDate(recurring.id, nextDueDate);
                }
            } catch (err) {
            }
        }

        return createdTransactions;
    }
}