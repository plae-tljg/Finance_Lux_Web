export interface CheckIn {
    id: number;
    checkInDate: string;
    streak: number;
    bonus: number;
    createdAt: string;
}

export type CheckInCreateInput = Omit<CheckIn, 'id' | 'createdAt'>;

export const CHECKIN_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkInDate)',
    'CREATE INDEX IF NOT EXISTS idx_checkins_streak ON checkins(streak)',
];

export const CheckInQueries = {
    CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkInDate TEXT UNIQUE NOT NULL,
        streak INTEGER DEFAULT 1,
        bonus INTEGER DEFAULT 10,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,

    INSERT: `
      INSERT INTO checkins (checkInDate, streak, bonus)
      VALUES (?, ?, ?)
    `,

    FIND_BY_DATE: 'SELECT * FROM checkins WHERE checkInDate = ?',

    GET_LATEST: 'SELECT * FROM checkins ORDER BY checkInDate DESC LIMIT 1',

    GET_ALL: 'SELECT * FROM checkins ORDER BY checkInDate DESC',

    GET_STREAK: 'SELECT SUM(streak) as totalStreak FROM checkins',

    GET_COUNT: 'SELECT COUNT(*) as count FROM checkins',

    DELETE_ALL: 'DELETE FROM checkins',
} as const;