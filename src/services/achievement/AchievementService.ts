import { useRepositories } from '../../contexts/RepositoryContext';
import type { Achievement } from '../database/schemas/Achievement';

class AchievementService {
    private static instance: AchievementService | null = null;
    private achievementRepo: ReturnType<typeof useRepositories>['achievementRepo'] | null = null;

    private constructor() {}

    public static getInstance(): AchievementService {
        if (!AchievementService.instance) {
            AchievementService.instance = new AchievementService();
        }
        return AchievementService.instance;
    }

    setAchievementRepo(repo: ReturnType<typeof useRepositories>['achievementRepo'] | null) {
        this.achievementRepo = repo;
    }

    async checkAndUnlock(key: string, progress: number): Promise<boolean> {
        if (!this.achievementRepo) return false;

        try {
            const achievement = await this.achievementRepo.findByKey(key);
            if (!achievement || achievement.isUnlocked) return false;

            await this.achievementRepo.updateProgress(key, progress);

            if (progress >= achievement.requirement) {
                await this.achievementRepo.unlock(key);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to check achievement ${key}:`, error);
            return false;
        }
    }

    async checkTransactionAchievements(transactionCount: number): Promise<Achievement | null> {
        const keys = ['first_transaction', 'ten_transactions', 'fifty_transactions', 'hundred_transactions'];
        const requirements = [1, 10, 50, 100];

        for (let i = keys.length - 1; i >= 0; i--) {
            const unlocked = await this.checkAndUnlock(keys[i], transactionCount);
            if (unlocked) {
                return await this.achievementRepo!.findByKey(keys[i]);
            }
        }
        return null;
    }

    async checkBudgetAchievements(budgetCount: number): Promise<Achievement | null> {
        const keys = ['first_budget', 'five_budgets', 'ten_budgets'];
        const requirements = [1, 5, 10];

        for (let i = keys.length - 1; i >= 0; i--) {
            const unlocked = await this.checkAndUnlock(keys[i], budgetCount);
            if (unlocked) {
                return await this.achievementRepo!.findByKey(keys[i]);
            }
        }
        return null;
    }

    async checkAccountAchievements(accountCount: number): Promise<Achievement | null> {
        const keys = ['first_account', 'three_accounts', 'five_accounts'];
        const requirements = [1, 3, 5];

        for (let i = keys.length - 1; i >= 0; i--) {
            const unlocked = await this.checkAndUnlock(keys[i], accountCount);
            if (unlocked) {
                return await this.achievementRepo!.findByKey(keys[i]);
            }
        }
        return null;
    }

    async checkShareAchievement(): Promise<Achievement | null> {
        const unlocked = await this.checkAndUnlock('share_report', 1);
        if (unlocked) {
            return await this.achievementRepo!.findByKey('share_report');
        }
        return null;
    }

    async checkTransferAchievement(): Promise<Achievement | null> {
        const unlocked = await this.checkAndUnlock('first_transfer', 1);
        if (unlocked) {
            return await this.achievementRepo!.findByKey('first_transfer');
        }
        return null;
    }

    async checkDarkModeAchievement(): Promise<Achievement | null> {
        const unlocked = await this.checkAndUnlock('dark_mode_user', 1);
        if (unlocked) {
            return await this.achievementRepo!.findByKey('dark_mode_user');
        }
        return null;
    }

    async checkThemeSwitchAchievement(switchCount: number): Promise<Achievement | null> {
        const unlocked = await this.checkAndUnlock('theme_switcher', switchCount);
        if (unlocked) {
            return await this.achievementRepo!.findByKey('theme_switcher');
        }
        return null;
    }

    async getUnlockedAchievements(): Promise<Achievement[]> {
        if (!this.achievementRepo) return [];
        return await this.achievementRepo.findUnlocked();
    }

    async getAllAchievements(): Promise<Achievement[]> {
        if (!this.achievementRepo) return [];
        return await this.achievementRepo.findAll();
    }
}

export const achievementService = AchievementService.getInstance();