export type AchievementCategory = 'transactions' | 'budgets' | 'accounts' | 'consistency' | 'social' | 'special';

export interface Achievement {
    id: number;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    requirement: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
    progress: number;
    createdAt: string;
    updatedAt: string;
}

export const ACHIEVEMENT_DEFINITIONS = [
    { key: 'first_transaction', name: 'First Step', description: 'Record your first transaction', icon: '🎯', category: 'transactions' as AchievementCategory, requirement: 1 },
    { key: 'ten_transactions', name: 'Getting Started', description: 'Record 10 transactions', icon: '📝', category: 'transactions' as AchievementCategory, requirement: 10 },
    { key: 'fifty_transactions', name: 'Active Recorder', description: 'Record 50 transactions', icon: '📚', category: 'transactions' as AchievementCategory, requirement: 50 },
    { key: 'hundred_transactions', name: 'Data Master', description: 'Record 100 transactions', icon: '👑', category: 'transactions' as AchievementCategory, requirement: 100 },
    { key: 'first_budget', name: 'Budget Builder', description: 'Create your first budget', icon: '📋', category: 'budgets' as AchievementCategory, requirement: 1 },
    { key: 'five_budgets', name: 'Planner', description: 'Create 5 budgets', icon: '🎯', category: 'budgets' as AchievementCategory, requirement: 5 },
    { key: 'ten_budgets', name: 'Master Planner', description: 'Create 10 budgets', icon: '🏆', category: 'budgets' as AchievementCategory, requirement: 10 },
    { key: 'first_account', name: 'Account Opener', description: 'Add your first account', icon: '🏦', category: 'accounts' as AchievementCategory, requirement: 1 },
    { key: 'three_accounts', name: 'Portfolio', description: 'Have 3 accounts', icon: '💼', category: 'accounts' as AchievementCategory, requirement: 3 },
    { key: 'five_accounts', name: 'Banker', description: 'Have 5 accounts', icon: '🏦', category: 'accounts' as AchievementCategory, requirement: 5 },
    { key: 'week_streak', name: 'Week Warrior', description: 'Log transactions for 7 consecutive days', icon: '🔥', category: 'consistency' as AchievementCategory, requirement: 7 },
    { key: 'month_streak', name: 'Month Master', description: 'Log transactions for 30 consecutive days', icon: '⭐', category: 'consistency' as AchievementCategory, requirement: 30 },
    { key: 'share_report', name: 'Sharer', description: 'Export a report', icon: '📤', category: 'social' as AchievementCategory, requirement: 1 },
    { key: 'first_transfer', name: 'Money Mover', description: 'Complete your first transfer', icon: '💸', category: 'special' as AchievementCategory, requirement: 1 },
    { key: 'dark_mode_user', name: 'Night Owl', description: 'Use dark mode', icon: '🦉', category: 'special' as AchievementCategory, requirement: 1 },
    { key: 'theme_switcher', name: 'Chameleon', description: 'Switch themes 10 times', icon: '🦎', category: 'special' as AchievementCategory, requirement: 10 },
] as const;

export const ACHIEVEMENT_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key)',
    'CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON achievements(isUnlocked)'
];

export const AchievementQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        category TEXT NOT NULL,
        requirement INTEGER NOT NULL,
        isUnlocked INTEGER DEFAULT 0,
        unlockedAt TEXT,
        progress INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,

    INSERT_ALL: `
      INSERT OR IGNORE INTO achievements (key, name, description, icon, category, requirement) VALUES (?, ?, ?, ?, ?, ?)
    `,

    GET_ALL: 'SELECT * FROM achievements ORDER BY isUnlocked DESC, category, key',

    GET_UNLOCKED: 'SELECT * FROM achievements WHERE isUnlocked = 1 ORDER BY unlockedAt DESC',

    GET_BY_KEY: 'SELECT * FROM achievements WHERE key = ?',

    UPDATE_PROGRESS: `
      UPDATE achievements SET progress = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?
    `,

    UNLOCK: `
      UPDATE achievements SET isUnlocked = 1, unlockedAt = CURRENT_TIMESTAMP, progress = requirement, updatedAt = CURRENT_TIMESTAMP WHERE key = ?
    `,

    RESET_PROGRESS: 'UPDATE achievements SET progress = 0, isUnlocked = 0, unlockedAt = NULL, updatedAt = CURRENT_TIMESTAMP'
} as const;