import type { BaseRepository } from './BaseRepository';
import type { CheckIn, CheckInCreateInput } from '../schemas/CheckIn';
import { CheckInQueries, CHECKIN_INDEXES } from '../schemas/CheckIn';
import type { QueryExecutor } from '../types/types';

export class CheckInRepository implements BaseRepository<CheckIn> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(CheckInQueries.CREATE_TABLE);
        for (const indexQuery of CHECKIN_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async createIndexes(): Promise<void> {
        for (const indexQuery of CHECKIN_INDEXES) {
            await this.db.executeQuery(indexQuery);
        }
    }

    async findByDate(date: string): Promise<CheckIn | null> {
        const result = await this.db.executeQuery<CheckIn>(CheckInQueries.FIND_BY_DATE, [date]);
        return result.rows.length > 0 ? result.rows._array[0] : null;
    }

    async findAll(): Promise<CheckIn[]> {
        const result = await this.db.executeQuery<CheckIn>(CheckInQueries.GET_ALL);
        return result.rows._array;
    }

    async getLatest(): Promise<CheckIn | null> {
        const result = await this.db.executeQuery<CheckIn>(CheckInQueries.GET_LATEST);
        return result.rows.length > 0 ? result.rows._array[0] : null;
    }

    async create(entity: CheckInCreateInput): Promise<CheckIn> {
        const result = await this.db.executeQuery(CheckInQueries.INSERT, [
            entity.checkInDate,
            entity.streak,
            entity.bonus,
        ]);
        const newId = result.insertId!;
        const created = await this.findByDate(entity.checkInDate);
        return created as CheckIn;
    }

    async delete(id: number): Promise<boolean> {
        return false;
    }

    async count(): Promise<number> {
        const result = await this.db.executeQuery<{ count: number }>(CheckInQueries.GET_COUNT);
        return result.rows.length > 0 ? result.rows._array[0].count : 0;
    }

    async getStreak(): Promise<number> {
        const result = await this.db.executeQuery<{ totalStreak: number }>(CheckInQueries.GET_STREAK);
        return result.rows.length > 0 ? result.rows._array[0].totalStreak : 0;
    }

    async resetAll(): Promise<void> {
        await this.db.executeQuery(CheckInQueries.DELETE_ALL);
    }
}