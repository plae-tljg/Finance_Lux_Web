import { Goal, GoalQueries, SAMPLE_GOALS } from '../schemas/Goal';
import type { BaseRepository } from './BaseRepository';
import type { QueryExecutor } from '../types/types';

export class GoalRepository implements BaseRepository<Goal> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(GoalQueries.CREATE_TABLE);
    }

    async createIndexes(): Promise<void> {
        for (const index of ['CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category)', 'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)', 'CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority)']) {
            await this.db.executeQuery(index);
        }
    }

    async insertInitialData(): Promise<void> {
        for (const goal of SAMPLE_GOALS) {
            await this.db.executeQuery(
                GoalQueries.INSERT,
                [goal.name, goal.description, goal.targetAmount, goal.currentAmount, goal.icon, goal.color, goal.deadline, goal.category, goal.priority, goal.status]
            );
        }
    }

    async insert(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<number> {
        const result = await this.db.executeQuery(
            GoalQueries.INSERT,
            [data.name, data.description, data.targetAmount, data.currentAmount, data.icon, data.color, data.deadline, data.category, data.priority, data.status]
        );
        return result.insertId ?? 0;
    }

    async findAll(): Promise<Goal[]> {
        const result = await this.db.executeQuery<Goal>(GoalQueries.FIND_ALL);
        return result.rows._array;
    }

    async findById(id: number): Promise<Goal | null> {
        const result = await this.db.executeQuery<Goal>(GoalQueries.FIND_BY_ID, [id]);
        return result.rows._array[0] || null;
    }

    async findActive(): Promise<Goal[]> {
        const result = await this.db.executeQuery<Goal>(GoalQueries.FIND_ACTIVE);
        return result.rows._array;
    }

    async findByCategory(category: Goal['category']): Promise<Goal[]> {
        const result = await this.db.executeQuery<Goal>(GoalQueries.FIND_BY_CATEGORY, [category]);
        return result.rows._array;
    }

    async findByStatus(status: Goal['status']): Promise<Goal[]> {
        const result = await this.db.executeQuery<Goal>(GoalQueries.FIND_BY_STATUS, [status]);
        return result.rows._array;
    }

    async update(id: number, data: Partial<Goal>): Promise<boolean> {
        const result = await this.db.executeQuery(
            GoalQueries.UPDATE,
            [data.name, data.description, data.targetAmount, data.currentAmount, data.icon, data.color, data.deadline, data.category, data.priority, data.status, data.completedAt, id]
        );
        return (result.changes ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.executeQuery(GoalQueries.DELETE, [id]);
        return (result.changes ?? 0) > 0;
    }

    async updateProgress(id: number, currentAmount: number): Promise<boolean> {
        const goal = await this.findById(id);
        if (!goal) return false;

        let newStatus = goal.status;
        if (currentAmount >= goal.targetAmount && goal.status === 'active') {
            newStatus = 'completed';
        }

        const result = await this.db.executeQuery(
            'UPDATE goals SET currentAmount = ?, status = ?, completedAt = CASE WHEN ? >= targetAmount THEN CURRENT_TIMESTAMP ELSE completedAt END, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [currentAmount, newStatus, currentAmount, id]
        );
        return (result.changes ?? 0) > 0;
    }

    async getStats(): Promise<{ active: number; completed: number; totalTarget: number; totalCurrent: number }> {
        const all = await this.findAll();
        const active = all.filter(g => g.status === 'active').length;
        const completed = all.filter(g => g.status === 'completed').length;
        const activeGoals = all.filter(g => g.status === 'active');
        const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalCurrent = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
        return { active, completed, totalTarget, totalCurrent };
    }
}