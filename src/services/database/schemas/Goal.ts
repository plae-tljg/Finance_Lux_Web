export interface Goal {
    id: number;
    name: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
    deadline: string;
    category: 'savings' | 'investment' | 'debt' | 'purchase' | 'emergency' | 'retirement' | 'other';
    priority: 'low' | 'medium' | 'high';
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
};

export const SAMPLE_GOALS: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>[] = [
    {
        name: '旅行基金',
        description: '为下次旅行存钱',
        targetAmount: 10000,
        currentAmount: 3500,
        icon: '✈️',
        color: '#3b82f6',
        deadline: '2026-12-31',
        category: 'savings',
        priority: 'medium',
        status: 'active',
    },
    {
        name: '紧急备用金',
        description: '3个月生活费用的应急基金',
        targetAmount: 50000,
        currentAmount: 25000,
        icon: '🛡️',
        color: '#10b981',
        deadline: '2026-06-30',
        category: 'emergency',
        priority: 'high',
        status: 'active',
    },
    {
        name: '新车购买',
        description: '计划购买一辆新能源汽车',
        targetAmount: 150000,
        currentAmount: 45000,
        icon: '🚗',
        color: '#8b5cf6',
        deadline: '2027-12-31',
        category: 'purchase',
        priority: 'low',
        status: 'active',
    },
];

export const GoalFields = {
    UPDATABLE: ['name', 'description', 'targetAmount', 'currentAmount', 'icon', 'color', 'deadline', 'category', 'priority', 'status', 'completedAt'] as const,
} as const;

export const GOAL_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category)',
    'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)',
    'CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority)',
];

export const GoalQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        targetAmount REAL NOT NULL DEFAULT 0,
        currentAmount REAL NOT NULL DEFAULT 0,
        icon TEXT DEFAULT '🎯',
        color TEXT DEFAULT '#3b82f6',
        deadline TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('savings', 'investment', 'debt', 'purchase', 'emergency', 'retirement', 'other')),
        priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME DEFAULT NULL
      )
    `,

    INSERT: `
      INSERT INTO goals (name, description, targetAmount, currentAmount, icon, color, deadline, category, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    UPDATE: `
      UPDATE goals
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          targetAmount = COALESCE(?, targetAmount),
          currentAmount = COALESCE(?, currentAmount),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          deadline = COALESCE(?, deadline),
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          completedAt = COALESCE(?, completedAt),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,

    DELETE: 'DELETE FROM goals WHERE id = ?',

    FIND_BY_ID: 'SELECT * FROM goals WHERE id = ?',

    FIND_ALL: 'SELECT * FROM goals ORDER BY priority DESC, deadline ASC',

    FIND_ACTIVE: "SELECT * FROM goals WHERE status = 'active' ORDER BY priority DESC, deadline ASC",

    FIND_BY_CATEGORY: 'SELECT * FROM goals WHERE category = ? ORDER BY priority DESC, deadline ASC',

    FIND_BY_STATUS: 'SELECT * FROM goals WHERE status = ? ORDER BY priority DESC, deadline ASC',

    FIND_BY_PRIORITY: 'SELECT * FROM goals WHERE priority = ? ORDER BY deadline ASC',

    FIND_COMPLETED: "SELECT * FROM goals WHERE status = 'completed' ORDER BY completedAt DESC",

    COUNT_ALL: 'SELECT COUNT(*) as count FROM goals',

    COUNT_ACTIVE: "SELECT COUNT(*) as count FROM goals WHERE status = 'active'",

    SUM_TARGET_AMOUNT: 'SELECT SUM(targetAmount) as total FROM goals WHERE status = "active"',

    SUM_CURRENT_AMOUNT: 'SELECT SUM(currentAmount) as total FROM goals WHERE status = "active"',
} as const;