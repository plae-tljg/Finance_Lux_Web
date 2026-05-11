import { Achievement, AchievementQueries, ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_INDEXES } from '../schemas/Achievement';
import type { BaseRepository } from './BaseRepository';
import type { QueryExecutor } from '../types/types';

export class AchievementRepository implements BaseRepository<Achievement> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(AchievementQueries.CREATE_TABLE);
    }

    async createIndexes(): Promise<void> {
        for (const index of ACHIEVEMENT_INDEXES) {
            await this.db.executeQuery(index);
        }
    }

    async insertInitialData(): Promise<void> {
        for (const def of ACHIEVEMENT_DEFINITIONS) {
            await this.db.executeQuery(
                AchievementQueries.INSERT_ALL,
                [def.key, def.name, def.description, def.icon, def.category, def.requirement]
            );
        }
    }

    async findAll(): Promise<Achievement[]> {
        const result = await this.db.executeQuery<Achievement>(AchievementQueries.GET_ALL);
        return result.rows._array;
    }

    async findUnlocked(): Promise<Achievement[]> {
        const result = await this.db.executeQuery<Achievement>(AchievementQueries.GET_UNLOCKED);
        return result.rows._array;
    }

    async findByKey(key: string): Promise<Achievement | null> {
        const result = await this.db.executeQuery<Achievement>(AchievementQueries.GET_BY_KEY, [key]);
        return result.rows._array[0] || null;
    }

    async updateProgress(key: string, progress: number): Promise<boolean> {
        const result = await this.db.executeQuery(
            AchievementQueries.UPDATE_PROGRESS,
            [progress, key]
        );
        return (result.changes ?? 0) > 0;
    }

    async unlock(key: string): Promise<boolean> {
        const result = await this.db.executeQuery(AchievementQueries.UNLOCK, [key]);
        return (result.changes ?? 0) > 0;
    }

    async resetAll(): Promise<boolean> {
        const result = await this.db.executeQuery(AchievementQueries.RESET_PROGRESS);
        return (result.changes ?? 0) > 0;
    }

    async getStats(): Promise<{ unlocked: number; total: number }> {
        const all = await this.findAll();
        const unlocked = all.filter(a => a.isUnlocked).length;
        return { unlocked, total: all.length };
    }
}