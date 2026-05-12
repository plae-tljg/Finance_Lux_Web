import DatabaseService from '../database/DatabaseService';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { AccountRepository } from '../database/repositories/AccountRepository';
import { AccountBalanceRepository } from '../database/repositories/AccountBalanceRepository';
import type { Category } from '../database/schemas/Category';
import type { Budget } from '../database/schemas/Budget';
import type { Transaction } from '../database/schemas/Transaction';
import type { Account } from '../database/schemas/Account';
import type { AccountBalance } from '../database/schemas/AccountBalance';

export interface ImportData {
  categories?: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[];
  budgets?: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[];
  transactions?: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[];
  accounts?: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[];
  accountBalances?: Omit<AccountBalance, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    categories: number;
    budgets: number;
    transactions: number;
    accounts: number;
    accountBalances: number;
  };
  errors: string[];
}

class ImportService {
  private static instance: ImportService | null = null;

  private constructor() {}

  public static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data: ImportData = JSON.parse(text);
      return await this.importData(data);
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: { categories: 0, budgets: 0, transactions: 0, accounts: 0, accountBalances: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async importData(data: ImportData): Promise<ImportResult> {
    const dbService = DatabaseService.getInstance();
    const db = dbService.getDatabase();

    if (!db) {
      throw new Error('Database not initialized');
    }

    db.run('DELETE FROM transactions');
    db.run('DELETE FROM budgets');
    db.run('DELETE FROM account_balances');
    db.run('DELETE FROM accounts');
    db.run('DELETE FROM categories');

    const result: ImportResult = {
      success: true,
      message: 'Import complete',
      imported: { categories: 0, budgets: 0, transactions: 0, accounts: 0, accountBalances: 0 },
      errors: []
    };

    try {
      if (data.categories && data.categories.length > 0) {
        const categoryRepo = new CategoryRepository(dbService);
        for (const category of data.categories) {
          try {
            await categoryRepo.create(category);
            result.imported.categories++;
          } catch (error) {
            result.errors.push(`Failed to import category: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (data.accounts && data.accounts.length > 0) {
        const accountRepo = new AccountRepository(dbService);
        for (const account of data.accounts) {
          try {
            await accountRepo.create(account);
            result.imported.accounts++;
          } catch (error) {
            result.errors.push(`Failed to import account: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (data.accountBalances && data.accountBalances.length > 0) {
        const accountBalanceRepo = new AccountBalanceRepository(dbService);
        for (const balance of data.accountBalances) {
          try {
            await accountBalanceRepo.upsert(balance);
            result.imported.accountBalances++;
          } catch (error) {
            result.errors.push(`Failed to import account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (data.budgets && data.budgets.length > 0) {
        const budgetRepo = new BudgetRepository(dbService);
        for (const budget of data.budgets) {
          try {
            await budgetRepo.create(budget);
            result.imported.budgets++;
          } catch (error) {
            result.errors.push(`Failed to import budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (data.transactions && data.transactions.length > 0) {
        const transactionRepo = new TransactionRepository(dbService);
        for (const transaction of data.transactions) {
          try {
            await transactionRepo.create(transaction);
            result.imported.transactions++;
          } catch (error) {
            result.errors.push(`Failed to import transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      const totalImported = result.imported.categories + result.imported.budgets + result.imported.transactions + result.imported.accounts + result.imported.accountBalances;

      if (result.errors.length > 0) {
        result.success = false;
        result.message = `Partial import: ${totalImported} records imported, ${result.errors.length} errors`;
      } else {
        result.message = `Successfully imported ${totalImported} records`;
      }
    } catch (error) {
      result.success = false;
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    dbService.saveToStorage();

    return result;
  }
}

export default ImportService;
export const importService = ImportService.getInstance();