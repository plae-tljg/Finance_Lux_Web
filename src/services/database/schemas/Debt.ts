export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'student_loan' | 'medical' | 'other';
export type DebtStatus = 'active' | 'paid_off' | 'paused' | 'cancelled';
export type InterestType = 'fixed' | 'variable';

export interface Debt {
    id: number;
    name: string;
    type: DebtType;
    creditor: string;
    initialAmount: number;
    currentBalance: number;
    interestRate: number;
    interestType: InterestType;
    minimumPayment: number;
    dueDate: string;
    startDate: string;
    status: DebtStatus;
    notes: string;
    icon: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    paidOffAt: string | null;
}

export const SAMPLE_DEBTS: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'paidOffAt'>[] = [
    {
        name: '信用卡债务',
        type: 'credit_card',
        creditor: '银行A',
        initialAmount: 20000,
        currentBalance: 18500,
        interestRate: 18.99,
        interestType: 'variable',
        minimumPayment: 500,
        dueDate: '2026-05-25',
        startDate: '2025-01-15',
        status: 'active',
        notes: '高利率信用卡，建议优先偿还',
        icon: '💳',
        color: '#ef4444',
    },
    {
        name: '汽车贷款',
        type: 'loan',
        creditor: '汽车金融公司',
        initialAmount: 80000,
        currentBalance: 65000,
        interestRate: 6.5,
        interestType: 'fixed',
        minimumPayment: 2500,
        dueDate: '2026-06-01',
        startDate: '2025-06-01',
        status: 'active',
        notes: '分期3年，已还12期',
        icon: '🚗',
        color: '#3b82f6',
    },
    {
        name: '房贷',
        type: 'mortgage',
        creditor: '中国建设银行',
        initialAmount: 3000000,
        currentBalance: 2800000,
        interestRate: 4.9,
        interestType: 'fixed',
        minimumPayment: 15000,
        dueDate: '2026-06-10',
        startDate: '2024-01-10',
        status: 'active',
        notes: '商业贷款，30年期限',
        icon: '🏠',
        color: '#10b981',
    },
];

export const DebtFields = {
    UPDATABLE: [
        'name', 'type', 'creditor', 'initialAmount', 'currentBalance',
        'interestRate', 'interestType', 'minimumPayment', 'dueDate',
        'startDate', 'status', 'notes', 'icon', 'color', 'paidOffAt'
    ] as const,
} as const;

export const DEBT_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type)',
    'CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)',
    'CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(dueDate)',
];

export const DebtQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage', 'student_loan', 'medical', 'other')),
        creditor TEXT DEFAULT '',
        initialAmount REAL NOT NULL DEFAULT 0,
        currentBalance REAL NOT NULL DEFAULT 0,
        interestRate REAL NOT NULL DEFAULT 0,
        interestType TEXT NOT NULL CHECK(interestType IN ('fixed', 'variable')) DEFAULT 'fixed',
        minimumPayment REAL NOT NULL DEFAULT 0,
        dueDate TEXT NOT NULL,
        startDate TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'paid_off', 'paused', 'cancelled')) DEFAULT 'active',
        notes TEXT DEFAULT '',
        icon TEXT DEFAULT '💳',
        color TEXT DEFAULT '#ef4444',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        paidOffAt DATETIME DEFAULT NULL
      )
    `,

    INSERT: `
      INSERT INTO debts (name, type, creditor, initialAmount, currentBalance, interestRate, interestType, minimumPayment, dueDate, startDate, status, notes, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    UPDATE: `
      UPDATE debts
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          creditor = COALESCE(?, creditor),
          initialAmount = COALESCE(?, initialAmount),
          currentBalance = COALESCE(?, currentBalance),
          interestRate = COALESCE(?, interestRate),
          interestType = COALESCE(?, interestType),
          minimumPayment = COALESCE(?, minimumPayment),
          dueDate = COALESCE(?, dueDate),
          startDate = COALESCE(?, startDate),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          paidOffAt = COALESCE(?, paidOffAt),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,

    DELETE: 'DELETE FROM debts WHERE id = ?',

    FIND_BY_ID: 'SELECT * FROM debts WHERE id = ?',

    FIND_ALL: 'SELECT * FROM debts ORDER BY status ASC, dueDate ASC',

    FIND_ACTIVE: "SELECT * FROM debts WHERE status = 'active' ORDER BY dueDate ASC",

    FIND_BY_TYPE: 'SELECT * FROM debts WHERE type = ? ORDER BY currentBalance DESC',

    FIND_BY_STATUS: 'SELECT * FROM debts WHERE status = ? ORDER BY dueDate ASC',

    FIND_PAID_OFF: "SELECT * FROM debts WHERE status = 'paid_off' ORDER BY paidOffAt DESC",

    COUNT_ALL: 'SELECT COUNT(*) as count FROM debts',

    COUNT_ACTIVE: "SELECT COUNT(*) as count FROM debts WHERE status = 'active'",

    SUM_CURRENT_BALANCE: 'SELECT SUM(currentBalance) as total FROM debts WHERE status = "active"',

    SUM_INITIAL_AMOUNT: 'SELECT SUM(initialAmount) as total FROM debts',

    SUM_MINIMUM_PAYMENT: 'SELECT SUM(minimumPayment) as total FROM debts WHERE status = "active"',

    FIND_DUE_SOON: `
      SELECT * FROM debts
      WHERE status = 'active'
      AND date(dueDate) <= date('now', '+7 days')
      ORDER BY dueDate ASC
    `,
} as const;