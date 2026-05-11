import type { Goal } from '../database/schemas/Goal';
import type { GoalRepository } from '../database/repositories/GoalRepository';

class GoalService {
    private static instance: GoalService | null = null;
    private goalRepo: GoalRepository | null = null;

    private constructor() {}

    public static getInstance(): GoalService {
        if (!GoalService.instance) {
            GoalService.instance = new GoalService();
        }
        return GoalService.instance;
    }

    setGoalRepo(repo: GoalRepository) {
        this.goalRepo = repo;
    }

    async getAllGoals(): Promise<Goal[]> {
        if (!this.goalRepo) return [];
        return await this.goalRepo.findAll();
    }

    async getActiveGoals(): Promise<Goal[]> {
        if (!this.goalRepo) return [];
        return await this.goalRepo.findActive();
    }

    async getGoalById(id: number): Promise<Goal | null> {
        if (!this.goalRepo) return null;
        return await this.goalRepo.findById(id);
    }

    async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<number> {
        if (!this.goalRepo) return 0;
        return await this.goalRepo.insert(data);
    }

    async updateGoal(id: number, data: Partial<Goal>): Promise<boolean> {
        if (!this.goalRepo) return false;
        return await this.goalRepo.update(id, data);
    }

    async updateGoalProgress(id: number, currentAmount: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        return await this.goalRepo.updateProgress(id, currentAmount);
    }

    async deleteGoal(id: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        return await this.goalRepo.delete(id);
    }

    async getGoalStats(): Promise<{ active: number; completed: number; totalTarget: number; totalCurrent: number }> {
        if (!this.goalRepo) return { active: 0, completed: 0, totalTarget: 0, totalCurrent: 0 };
        return await this.goalRepo.getStats();
    }

    async getGoalsByCategory(category: Goal['category']): Promise<Goal[]> {
        if (!this.goalRepo) return [];
        return await this.goalRepo.findByCategory(category);
    }

    async getGoalsByStatus(status: Goal['status']): Promise<Goal[]> {
        if (!this.goalRepo) return [];
        return await this.goalRepo.findByStatus(status);
    }

    async completeGoal(id: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        const goal = await this.goalRepo.findById(id);
        if (!goal) return false;
        return await this.goalRepo.update(id, { status: 'completed', completedAt: new Date().toISOString() });
    }

    async pauseGoal(id: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        return await this.goalRepo.update(id, { status: 'paused' });
    }

    async resumeGoal(id: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        return await this.goalRepo.update(id, { status: 'active' });
    }

    async addContribution(id: number, amount: number): Promise<boolean> {
        if (!this.goalRepo) return false;
        const goal = await this.goalRepo.findById(id);
        if (!goal) return false;
        const newAmount = goal.currentAmount + amount;
        return await this.goalRepo.updateProgress(id, newAmount);
    }

    calculateProgress(goal: Goal): number {
        if (goal.targetAmount === 0) return 0;
        return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    }

    getDaysRemaining(goal: Goal): number {
        const today = new Date();
        const deadline = new Date(goal.deadline);
        const diff = deadline.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    isOnTrack(goal: Goal): boolean {
        const daysRemaining = this.getDaysRemaining(goal);
        if (daysRemaining === 0) return goal.currentAmount >= goal.targetAmount;

        const totalDays = Math.ceil((new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = totalDays - daysRemaining;
        const expectedProgress = daysPassed / totalDays;
        const actualProgress = goal.currentAmount / goal.targetAmount;

        return actualProgress >= expectedProgress;
    }
}

export const goalService = GoalService.getInstance();