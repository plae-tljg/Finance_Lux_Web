import type { BaseRepository } from './BaseRepository';
import type { RecurringTransaction, RecurringTransactionCreateInput } from '../schemas/RecurringTransaction';
import { RecurringTransactionQueries, RECURRING_TRANSACTION_INDEXES } from '../schemas/RecurringTransaction';
import type { QueryExecutor } from '../types/types';

export class RecurringTransactionRepository implements BaseRepository<RecurringTransaction> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(RecurringTransactionQueries.CREATE_TABLE);
        for (const indexQuery of RECURRING_TRANSACTION_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async createIndexes(): Promise<void> {
        for (const indexQuery of RECURRING_TRANSACTION_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async findById(id: number): Promise<RecurringTransaction | null> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_BY_ID, [id]);
        return result.rows.length > 0 ? result.rows._array[0] : null;
    }

    async findAll(): Promise<RecurringTransaction[]> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_ALL);
        return result.rows._array;
    }

    async findActive(): Promise<RecurringTransaction[]> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_ACTIVE);
        return result.rows._array;
    }

    async findDueBefore(date: string): Promise<RecurringTransaction[]> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_DUE_BEFORE, [date]);
        return result.rows._array;
    }

    async findByAccount(accountId: number): Promise<RecurringTransaction[]> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_BY_ACCOUNT, [accountId]);
        return result.rows._array;
    }

    async findByCategory(categoryId: number): Promise<RecurringTransaction[]> {
        const result = await this.db.executeQuery<RecurringTransaction>(RecurringTransactionQueries.FIND_BY_CATEGORY, [categoryId]);
        return result.rows._array;
    }

    async create(entity: RecurringTransactionCreateInput): Promise<RecurringTransaction> {
        const result = await this.db.executeQuery(RecurringTransactionQueries.INSERT, [
            entity.amount,
            entity.categoryId,
            entity.accountId,
            entity.budgetId,
            entity.description,
            entity.type,
            entity.frequency,
            entity.startDate,
            entity.endDate,
            entity.nextDueDate,
            entity.isActive ? 1 : 0,
        ]);
        const newId = result.insertId!;
        return (await this.findById(newId)) as RecurringTransaction;
    }

    async update(id: number, entity: Partial<RecurringTransaction>): Promise<boolean> {
        const fields = Object.keys(entity) as (keyof RecurringTransaction)[];
        if (fields.length === 0) return false;

        const values = fields.map(f => {
            const val = (entity as Record<string, unknown>)[f];
            if (typeof val === 'boolean') return val ? 1 : 0;
            return val;
        });
        values.push(id);

        const query = RecurringTransactionQueries.UPDATE;
        const result = await this.db.executeQuery(query, values);
        return (result.changes ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.executeQuery(RecurringTransactionQueries.DELETE, [id]);
        return (result.changes ?? 0) > 0;
    }

    async count(): Promise<number> {
        const result = await this.db.executeQuery<{ count: number }>(RecurringTransactionQueries.COUNT_ALL);
        return result.rows.length > 0 ? result.rows._array[0].count : 0;
    }

    async updateNextDueDate(id: number, nextDueDate: string): Promise<boolean> {
        const result = await this.db.executeQuery(RecurringTransactionQueries.UPDATE_NEXT_DUE_DATE, [nextDueDate, id]);
        return (result.changes ?? 0) > 0;
    }

    async setInactive(id: number): Promise<boolean> {
        const result = await this.db.executeQuery(RecurringTransactionQueries.SET_INACTIVE, [id]);
        return (result.changes ?? 0) > 0;
    }

    calculateNextDueDate(currentDueDate: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
        const date = new Date(currentDueDate);
        switch (frequency) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString().split('T')[0];
    }
}