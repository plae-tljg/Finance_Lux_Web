import { BaseRepository } from './BaseRepository';
import { Notification, NotificationCreateInput, NotificationQueries } from '../schemas/Notification';

export class NotificationRepository extends BaseRepository<Notification> {
    async create(data: NotificationCreateInput): Promise<Notification> {
        const now = new Date().toISOString();
        const result = await this.runQuery(
            NotificationQueries.INSERT,
            [
                data.type,
                data.title,
                data.message,
                data.isRead ? 1 : 0,
                data.priority,
                data.actionUrl,
                now,
                data.expiresAt,
            ]
        );
        return this.getById(result.lastInsertRowid as number) as Promise<Notification>;
    }

    async update(id: number, data: Partial<Notification>): Promise<Notification | null> {
        await this.runQuery(NotificationQueries.UPDATE, [
            data.type,
            data.title,
            data.message,
            data.isRead !== undefined ? (data.isRead ? 1 : 0) : null,
            data.priority,
            data.actionUrl,
            data.expiresAt,
            id,
        ]);
        return this.getById(id);
    }

    async delete(id: number): Promise<void> {
        await this.runQuery(NotificationQueries.DELETE, [id]);
    }

    async markRead(id: number): Promise<void> {
        await this.runQuery(NotificationQueries.MARK_READ, [id]);
    }

    async markAllRead(): Promise<void> {
        await this.runQuery(NotificationQueries.MARK_ALL_READ, []);
    }

    async markReadByType(type: string): Promise<void> {
        await this.runQuery(NotificationQueries.MARK_READ_BY_TYPE, [type]);
    }

    async getById(id: number): Promise<Notification | null> {
        const row = await this.runQuery(NotificationQueries.FIND_BY_ID, [id]);
        return row.length > 0 ? this.mapRowToModel(row[0]) : null;
    }

    async getAll(): Promise<Notification[]> {
        const rows = await this.runQuery(NotificationQueries.FIND_ALL, []);
        return rows.map(row => this.mapRowToModel(row));
    }

    async getUnread(): Promise<Notification[]> {
        const rows = await this.runQuery(NotificationQueries.FIND_UNREAD, []);
        return rows.map(row => this.mapRowToModel(row));
    }

    async getByType(type: string): Promise<Notification[]> {
        const rows = await this.runQuery(NotificationQueries.FIND_BY_TYPE, [type]);
        return rows.map(row => this.mapRowToModel(row));
    }

    async getExpired(): Promise<Notification[]> {
        const rows = await this.runQuery(NotificationQueries.FIND_EXPIRED, []);
        return rows.map(row => this.mapRowToModel(row));
    }

    async deleteExpired(): Promise<void> {
        await this.runQuery(NotificationQueries.DELETE_EXPIRED, []);
    }

    async getUnreadCount(): Promise<number> {
        const result = await this.runQuery(NotificationQueries.COUNT_UNREAD, []);
        return result[0]?.count || 0;
    }

    async cleanupOld(daysOld: number = 30): Promise<void> {
        await this.runQuery(
            `DELETE FROM notifications WHERE createdAt < datetime('now', '-${daysOld} days')`,
            []
        );
    }

    protected mapRowToModel(row: Record<string, unknown>): Notification {
        return {
            id: row.id as number,
            type: row.type as Notification['type'],
            title: row.title as string,
            message: row.message as string,
            isRead: Boolean(row.isRead),
            priority: row.priority as Notification['priority'],
            actionUrl: row.actionUrl as string | null,
            createdAt: row.createdAt as string,
            expiresAt: row.expiresAt as string | null,
        };
    }
}