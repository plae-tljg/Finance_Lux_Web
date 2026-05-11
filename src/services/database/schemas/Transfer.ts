export interface Transfer {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description: string | null;
    date: string;
    createdAt: string;
    updatedAt: string;
};

export type TransferCreateInput = Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>;

export const TRANSFER_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(fromAccountId)',
    'CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(toAccountId)',
    'CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date)',
];

export const TransferQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fromAccountId INTEGER NOT NULL,
        toAccountId INTEGER NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT,
        date DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fromAccountId) REFERENCES accounts(id),
        FOREIGN KEY (toAccountId) REFERENCES accounts(id),
        CHECK(fromAccountId != toAccountId)
      )
    `,

    INSERT: `
      INSERT INTO transfers (fromAccountId, toAccountId, amount, description, date)
      VALUES (?, ?, ?, ?, ?)
    `,

    UPDATE: `
      UPDATE transfers
      SET fromAccountId = COALESCE(?, fromAccountId),
          toAccountId = COALESCE(?, toAccountId),
          amount = COALESCE(?, amount),
          description = COALESCE(?, description),
          date = COALESCE(?, date),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,

    DELETE: 'DELETE FROM transfers WHERE id = ?',

    FIND_BY_ID: `
      SELECT t.*,
             fa.name as fromAccountName, fa.icon as fromAccountIcon,
             ta.name as toAccountName, ta.icon as toAccountIcon
      FROM transfers t
      LEFT JOIN accounts fa ON t.fromAccountId = fa.id
      LEFT JOIN accounts ta ON t.toAccountId = ta.id
      WHERE t.id = ?
    `,

    FIND_ALL: `
      SELECT t.*,
             fa.name as fromAccountName, fa.icon as fromAccountIcon,
             ta.name as toAccountName, ta.icon as toAccountIcon
      FROM transfers t
      LEFT JOIN accounts fa ON t.fromAccountId = fa.id
      LEFT JOIN accounts ta ON t.toAccountId = ta.id
      ORDER BY t.date DESC
    `,

    FIND_BY_DATE_RANGE: `
      SELECT t.*,
             fa.name as fromAccountName, fa.icon as fromAccountIcon,
             ta.name as toAccountName, ta.icon as toAccountIcon
      FROM transfers t
      LEFT JOIN accounts fa ON t.fromAccountId = fa.id
      LEFT JOIN accounts ta ON t.toAccountId = ta.id
      WHERE t.date BETWEEN ? AND ?
      ORDER BY t.date DESC
    `,

    FIND_BY_ACCOUNT: `
      SELECT t.*,
             fa.name as fromAccountName, fa.icon as fromAccountIcon,
             ta.name as toAccountName, ta.icon as toAccountIcon
      FROM transfers t
      LEFT JOIN accounts fa ON t.fromAccountId = fa.id
      LEFT JOIN accounts ta ON t.toAccountId = ta.id
      WHERE t.fromAccountId = ? OR t.toAccountId = ?
      ORDER BY t.date DESC
    `,

    COUNT_ALL: 'SELECT COUNT(*) as count FROM transfers',

    GET_TOTAL_BY_ACCOUNT: `
      SELECT
        accountId,
        SUM(CASE WHEN accountId = fromAccountId THEN amount ELSE 0 END) as totalOut,
        SUM(CASE WHEN accountId = toAccountId THEN amount ELSE 0 END) as totalIn
      FROM (
        SELECT fromAccountId as accountId, amount FROM transfers
        UNION ALL
        SELECT toAccountId as accountId, amount FROM transfers
      )
      WHERE accountId = ?
      GROUP BY accountId
    `,
} as const;