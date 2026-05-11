import type { BaseRepository } from './BaseRepository';
import type { Transfer, TransferCreateInput } from '../schemas/Transfer';
import { TransferQueries, TRANSFER_INDEXES } from '../schemas/Transfer';
import type { QueryExecutor } from '../types/types';

export interface TransferWithAccounts extends Transfer {
    fromAccountName: string;
    fromAccountIcon: string;
    toAccountName: string;
    toAccountIcon: string;
}

export class TransferRepository implements BaseRepository<Transfer> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(TransferQueries.CREATE_TABLE);
        for (const indexQuery of TRANSFER_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async createIndexes(): Promise<void> {
        for (const indexQuery of TRANSFER_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async findById(id: number): Promise<TransferWithAccounts | null> {
        const result = await this.db.executeQuery<TransferWithAccounts>(TransferQueries.FIND_BY_ID, [id]);
        return result.rows.length > 0 ? result.rows._array[0] : null;
    }

    async findAll(): Promise<TransferWithAccounts[]> {
        const result = await this.db.executeQuery<TransferWithAccounts>(TransferQueries.FIND_ALL);
        return result.rows._array;
    }

    async findByDateRange(startDate: string, endDate: string): Promise<TransferWithAccounts[]> {
        const result = await this.db.executeQuery<TransferWithAccounts>(TransferQueries.FIND_BY_DATE_RANGE, [startDate, endDate]);
        return result.rows._array;
    }

    async findByAccount(accountId: number): Promise<TransferWithAccounts[]> {
        const result = await this.db.executeQuery<TransferWithAccounts>(TransferQueries.FIND_BY_ACCOUNT, [accountId, accountId]);
        return result.rows._array;
    }

    async create(entity: TransferCreateInput): Promise<Transfer> {
        const result = await this.db.executeQuery(TransferQueries.INSERT, [
            entity.fromAccountId,
            entity.toAccountId,
            entity.amount,
            entity.description,
            entity.date,
        ]);
        const newId = result.insertId!;
        return (await this.findById(newId)) as Transfer;
    }

    async update(id: number, entity: Partial<Transfer>): Promise<boolean> {
        const fields = Object.keys(entity) as (keyof Transfer)[];
        if (fields.length === 0) return false;

        const values = fields.map(f => (entity as Record<string, unknown>)[f]);
        values.push(id);

        const query = TransferQueries.UPDATE;
        const result = await this.db.executeQuery(query, values);
        return (result.changes ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.executeQuery(TransferQueries.DELETE, [id]);
        return (result.changes ?? 0) > 0;
    }

    async count(): Promise<number> {
        const result = await this.db.executeQuery<{ count: number }>(TransferQueries.COUNT_ALL);
        return result.rows.length > 0 ? result.rows._array[0].count : 0;
    }
}