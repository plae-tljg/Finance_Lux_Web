export interface RecurringTransaction {
    id: number;
    amount: number;
    categoryId: number;
    accountId: number;
    budgetId: number;
    description: string | null;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string | null;
    nextDueDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type RecurringTransactionCreateInput = Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>;

export const RECURRING_TRANSACTION_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_transactions(nextDueDate)',
    'CREATE INDEX IF NOT EXISTS idx_recurring_category ON recurring_transactions(categoryId)',
    'CREATE INDEX IF NOT EXISTS idx_recurring_account ON recurring_transactions(accountId)',
    'CREATE INDEX IF NOT EXISTS idx_recurring_is_active ON recurring_transactions(isActive)',
];

export const RecurringTransactionQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        categoryId INTEGER NOT NULL,
        accountId INTEGER NOT NULL,
        budgetId INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        startDate DATETIME NOT NULL,
        endDate DATETIME,
        nextDueDate DATETIME NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES categories(id),
        FOREIGN KEY (accountId) REFERENCES accounts(id),
        FOREIGN KEY (budgetId) REFERENCES budgets(id)
      )
    `,

    INSERT: `
      INSERT INTO recurring_transactions (
        amount, categoryId, accountId, budgetId, description, type,
        frequency, startDate, endDate, nextDueDate, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    UPDATE: `
      UPDATE recurring_transactions
      SET amount = COALESCE(?, amount),
          categoryId = COALESCE(?, categoryId),
          accountId = COALESCE(?, accountId),
          budgetId = COALESCE(?, budgetId),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          frequency = COALESCE(?, frequency),
          startDate = COALESCE(?, startDate),
          endDate = COALESCE(?, endDate),
          nextDueDate = COALESCE(?, nextDueDate),
          isActive = COALESCE(?, isActive),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,

    DELETE: 'DELETE FROM recurring_transactions WHERE id = ?',

    FIND_BY_ID: 'SELECT * FROM recurring_transactions WHERE id = ?',

    FIND_ALL: 'SELECT * FROM recurring_transactions ORDER BY nextDueDate ASC',

    FIND_ACTIVE: 'SELECT * FROM recurring_transactions WHERE isActive = 1 ORDER BY nextDueDate ASC',

    FIND_DUE_BEFORE: 'SELECT * FROM recurring_transactions WHERE isActive = 1 AND nextDueDate <= ? ORDER BY nextDueDate ASC',

    FIND_BY_ACCOUNT: 'SELECT * FROM recurring_transactions WHERE accountId = ? ORDER BY nextDueDate ASC',

    FIND_BY_CATEGORY: 'SELECT * FROM recurring_transactions WHERE categoryId = ? ORDER BY nextDueDate ASC',

    COUNT_ALL: 'SELECT COUNT(*) as count FROM recurring_transactions',

    UPDATE_NEXT_DUE_DATE: 'UPDATE recurring_transactions SET nextDueDate = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',

    SET_INACTIVE: 'UPDATE recurring_transactions SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
} as const;