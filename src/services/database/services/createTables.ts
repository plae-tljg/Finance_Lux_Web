import { CategoryRepository, BudgetRepository, TransactionRepository, AccountRepository, AccountBalanceRepository, TransferRepository, AchievementRepository, RecurringTransactionRepository, NotificationRepository, DebtRepository } from '../repositories';
import { checkIfDataExists } from './checkTables';
import { type Database } from 'sql.js';
import DatabaseService from '../DatabaseService';

const repositories = [
    CategoryRepository,
    AccountRepository,
    AccountBalanceRepository,
    BudgetRepository,
    TransactionRepository,
    TransferRepository,
    RecurringTransactionRepository,
    AchievementRepository,
    NotificationRepository,
    DebtRepository
]

export const createTables = async (_db: Database, insertSampleData: boolean = false) => {
    const dbService = DatabaseService.getInstance();
    for (const RepositoryClass of repositories) {
        const repository = new RepositoryClass(dbService);
        await repository.createTable();
        if (insertSampleData) {
            if (RepositoryClass === AchievementRepository) {
                await repository.insertInitialData();
            } else if (repository.insertSampleData) {
                await repository.insertSampleData();
            }
        }
    }
}

export const insertSampleData = async (db: Database) => {
    if (checkIfDataExists(db)) {
        return;
    }

    const dbService = DatabaseService.getInstance();
    for (const RepositoryClass of repositories) {
        const repository = new RepositoryClass(dbService);
        await repository.insertSampleData();
    }
}

export const insertSampleDataWithCheck = async (db: Database) => {
    if (checkIfDataExists(db)) {
        return;
    }

    const dbService = DatabaseService.getInstance();
    for (const RepositoryClass of repositories) {
        const repository = new RepositoryClass(dbService);
        await repository.insertSampleData();
    }
}

export const createIndex = async (_db: Database) => {
    const dbService = DatabaseService.getInstance();
    for (const RepositoryClass of repositories) {
        const repository = new RepositoryClass(dbService);
        await repository.createIndexes();
    }
}

export const initializeDatabaseFull = async (db: Database) => {
    if (!db) {
        throw new Error('数据库连接未初始化');
    }
    await createTables(db, true);
    await createIndex(db);

    if (checkIfDataExists(db)) {
        return;
    }

    await insertSampleData(db);

}