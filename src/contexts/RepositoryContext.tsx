import { createContext, useContext, useMemo } from 'react';
import { useDatabase } from './DatabaseContext';
import { CategoryRepository } from '../services/database/repositories/CategoryRepository';
import { BudgetRepository } from '../services/database/repositories/BudgetRepository';
import { TransactionRepository } from '../services/database/repositories/TransactionRepository';
import { AccountRepository } from '../services/database/repositories/AccountRepository';
import { AccountBalanceRepository } from '../services/database/repositories/AccountBalanceRepository';
import { TransferRepository } from '../services/database/repositories/TransferRepository';
import { RecurringTransactionRepository } from '../services/database/repositories/RecurringTransactionRepository';
import { AchievementRepository } from '../services/database/repositories/AchievementRepository';
import { CheckInRepository } from '../services/database/repositories/CheckInRepository';
import { GoalRepository } from '../services/database/repositories/GoalRepository';
import { NotificationRepository } from '../services/database/repositories/NotificationRepository';
import { DebtRepository } from '../services/database/repositories/DebtRepository';
import type { Category } from '../services/database/schemas/Category';
import type { Budget } from '../services/database/schemas/Budget';
import type { Transaction } from '../services/database/schemas/Transaction';
import type { Account } from '../services/database/schemas/Account';
import type { AccountBalance } from '../services/database/schemas/AccountBalance';
import type { Transfer } from '../services/database/schemas/Transfer';
import type { RecurringTransaction } from '../services/database/schemas/RecurringTransaction';
import type { Achievement } from '../services/database/schemas/Achievement';
import type { CheckIn } from '../services/database/schemas/CheckIn';
import type { Goal } from '../services/database/schemas/Goal';
import type { Notification } from '../services/database/schemas/Notification';
import type { Debt } from '../services/database/schemas/Debt';

interface Repositories {
    categoryRepo: CategoryRepository | null;
    budgetRepo: BudgetRepository | null;
    transactionRepo: TransactionRepository | null;
    accountRepo: AccountRepository | null;
    accountBalanceRepo: AccountBalanceRepository | null;
    transferRepo: TransferRepository | null;
    recurringTransactionRepo: RecurringTransactionRepository | null;
    achievementRepo: AchievementRepository | null;
    checkInRepo: CheckInRepository | null;
    goalRepo: GoalRepository | null;
    notificationRepo: NotificationRepository | null;
    debtRepo: DebtRepository | null;
}

interface RepositoryContextValue extends Repositories {
    isReady: boolean;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
    const { dbService, isReady } = useDatabase();

    const repositories = useMemo<Repositories>(() => {
        if (!dbService) {
            return {
                categoryRepo: null,
                budgetRepo: null,
                transactionRepo: null,
                accountRepo: null,
                accountBalanceRepo: null,
                transferRepo: null,
                recurringTransactionRepo: null,
                achievementRepo: null,
                checkInRepo: null,
                goalRepo: null,
                notificationRepo: null,
                debtRepo: null,
            };
        }

        return {
                categoryRepo: new CategoryRepository(dbService),
                budgetRepo: new BudgetRepository(dbService),
                transactionRepo: new TransactionRepository(dbService),
                accountRepo: new AccountRepository(dbService),
                accountBalanceRepo: new AccountBalanceRepository(dbService),
                transferRepo: new TransferRepository(dbService),
                recurringTransactionRepo: new RecurringTransactionRepository(dbService),
                achievementRepo: new AchievementRepository(dbService),
                checkInRepo: new CheckInRepository(dbService),
                goalRepo: new GoalRepository(dbService),
                notificationRepo: new NotificationRepository(dbService),
                debtRepo: new DebtRepository(dbService),
            };
    }, [dbService]);

    const value = useMemo(() => ({
        ...repositories,
        isReady,
    }), [repositories, isReady]);

    return (
        <RepositoryContext.Provider value={value}>
            {children}
        </RepositoryContext.Provider>
    );
}

export function useRepositories() {
    const context = useContext(RepositoryContext);
    if (!context) {
        throw new Error('useRepositories must be used within a RepositoryProvider');
    }
    return context;
}

export function useCategoryRepository(): CategoryRepository | null {
    const { categoryRepo, isReady } = useRepositories();
    if (!isReady || !categoryRepo) {
        return null;
    }
    return categoryRepo;
}

export function useBudgetRepository(): BudgetRepository | null {
    const { budgetRepo, isReady } = useRepositories();
    if (!isReady || !budgetRepo) {
        return null;
    }
    return budgetRepo;
}

export function useTransactionRepository(): TransactionRepository | null {
    const { transactionRepo, isReady } = useRepositories();
    if (!isReady || !transactionRepo) {
        return null;
    }
    return transactionRepo;
}

export function useAccountRepository(): AccountRepository | null {
    const { accountRepo, isReady } = useRepositories();
    if (!isReady || !accountRepo) {
        return null;
    }
    return accountRepo;
}

export function useAccountBalanceRepository(): AccountBalanceRepository | null {
    const { accountBalanceRepo, isReady } = useRepositories();
    if (!isReady || !accountBalanceRepo) {
        return null;
    }
    return accountBalanceRepo;
}

export function useTransferRepository(): TransferRepository | null {
    const { transferRepo, isReady } = useRepositories();
    if (!isReady || !transferRepo) {
        return null;
    }
    return transferRepo;
}

export function useAchievementRepository(): AchievementRepository | null {
    const { achievementRepo, isReady } = useRepositories();
    if (!isReady || !achievementRepo) {
        return null;
    }
    return achievementRepo;
}

export function useCheckInRepository(): CheckInRepository | null {
    const { checkInRepo, isReady } = useRepositories();
    if (!isReady || !checkInRepo) {
        return null;
    }
    return checkInRepo;
}

export function useGoalRepository(): GoalRepository | null {
    const { goalRepo, isReady } = useRepositories();
    if (!isReady || !goalRepo) {
        return null;
    }
    return goalRepo;
}

export function useRecurringTransactionRepository(): RecurringTransactionRepository | null {
    const { recurringTransactionRepo, isReady } = useRepositories();
    if (!isReady || !recurringTransactionRepo) {
        return null;
    }
    return recurringTransactionRepo;
}

export function useDebtRepository(): DebtRepository | null {
    const { debtRepo, isReady } = useRepositories();
    if (!isReady || !debtRepo) {
        return null;
    }
    return debtRepo;
}

export type { Category, Budget, Transaction, Account, AccountBalance, Transfer, RecurringTransaction, Achievement, CheckIn, Goal, Notification, Debt };