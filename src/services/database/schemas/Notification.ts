export interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'achievement';
    title: string;
    message: string;
    isRead: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl: string | null;
    createdAt: string;
    expiresAt: string | null;
}

export type NotificationCreateInput = Omit<Notification, 'id' | 'createdAt'>;

export const NOTIFICATION_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notifications(isRead)',
    'CREATE INDEX IF NOT EXISTS idx_notification_type ON notifications(type)',
    'CREATE INDEX IF NOT EXISTS idx_notification_priority ON notifications(priority)',
    'CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(createdAt DESC)',
];

export const NotificationQueries = {
    CREATE_TABLE: `
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error', 'reminder', 'achievement')),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            isRead INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
            actionUrl TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiresAt DATETIME
        )
    `,

    INSERT: `
        INSERT INTO notifications (type, title, message, isRead, priority, actionUrl, createdAt, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,

    UPDATE: `
        UPDATE notifications
        SET type = COALESCE(?, type),
            title = COALESCE(?, title),
            message = COALESCE(?, message),
            isRead = COALESCE(?, isRead),
            priority = COALESCE(?, priority),
            actionUrl = COALESCE(?, actionUrl),
            expiresAt = COALESCE(?, expiresAt)
        WHERE id = ?
    `,

    DELETE: 'DELETE FROM notifications WHERE id = ?',

    MARK_READ: 'UPDATE notifications SET isRead = 1 WHERE id = ?',

    MARK_ALL_READ: 'UPDATE notifications SET isRead = 1',

    MARK_READ_BY_TYPE: 'UPDATE notifications SET isRead = 1 WHERE type = ?',

    FIND_BY_ID: 'SELECT * FROM notifications WHERE id = ?',

    FIND_ALL: 'SELECT * FROM notifications ORDER BY createdAt DESC',

    FIND_UNREAD: 'SELECT * FROM notifications WHERE isRead = 0 ORDER BY createdAt DESC',

    FIND_BY_TYPE: 'SELECT * FROM notifications WHERE type = ? ORDER BY createdAt DESC',

    FIND_EXPIRED: "SELECT * FROM notifications WHERE expiresAt IS NOT NULL AND expiresAt < datetime('now')",

    DELETE_EXPIRED: "DELETE FROM notifications WHERE expiresAt IS NOT NULL AND expiresAt < datetime('now')",

    COUNT_UNREAD: 'SELECT COUNT(*) as count FROM notifications WHERE isRead = 0',

    CLEANUP_old: 'DELETE FROM notifications WHERE createdAt < datetime("now", "-30 days")',
} as const;