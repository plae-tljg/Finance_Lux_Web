import { Notification, NotificationCreateInput } from '../database/schemas/Notification';
import { NotificationRepository } from '../database/repositories/NotificationRepository';
import { AchievementRepository } from '../database/repositories/AchievementRepository';
import { GoalRepository } from '../database/repositories/GoalRepository';
import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { RecurringTransactionRepository } from '../database/repositories/RecurringTransactionRepository';
import { CheckInRepository } from '../database/repositories/CheckInRepository';

export class NotificationService {
    private notificationRepo: NotificationRepository;
    private achievementRepo: AchievementRepository;
    private goalRepo: GoalRepository;
    private budgetRepo: BudgetRepository;
    private recurringRepo: RecurringTransactionRepository;
    private checkInRepo: CheckInRepository;

    constructor(
        notificationRepo: NotificationRepository,
        achievementRepo: AchievementRepository,
        goalRepo: GoalRepository,
        budgetRepo: BudgetRepository,
        recurringRepo: RecurringTransactionRepository,
        checkInRepo: CheckInRepository
    ) {
        this.notificationRepo = notificationRepo;
        this.achievementRepo = achievementRepo;
        this.goalRepo = goalRepo;
        this.budgetRepo = budgetRepo;
        this.recurringRepo = recurringRepo;
        this.checkInRepo = checkInRepo;
    }

    async createNotification(data: NotificationCreateInput): Promise<Notification> {
        return this.notificationRepo.create(data);
    }

    async getAllNotifications(): Promise<Notification[]> {
        return this.notificationRepo.getAll();
    }

    async getUnreadNotifications(): Promise<Notification[]> {
        return this.notificationRepo.getUnread();
    }

    async markAsRead(id: number): Promise<void> {
        return this.notificationRepo.markRead(id);
    }

    async markAllAsRead(): Promise<void> {
        return this.notificationRepo.markAllRead();
    }

    async deleteNotification(id: number): Promise<void> {
        return this.notificationRepo.delete(id);
    }

    async getUnreadCount(): Promise<number> {
        return this.notificationRepo.getUnreadCount();
    }

    async cleanupExpired(): Promise<void> {
        return this.notificationRepo.deleteExpired();
    }

    async checkAndGenerateBudgetAlerts(
        budgets: { id: number; name: string; amount: number }[],
        spentByBudget: Map<number, number>
    ): Promise<void> {
        for (const budget of budgets) {
            const spent = spentByBudget.get(budget.id) || 0;
            const percentage = (spent / budget.amount) * 100;

            if (percentage >= 100) {
                const exists = await this.notificationRepo.getAll();
                const alreadyNotified = exists.some(
                    n => n.type === 'warning' && n.message.includes(`Budget "${budget.name}" exceeded`)
                );
                if (!alreadyNotified) {
                    await this.createNotification({
                        type: 'warning',
                        title: 'Budget Exceeded!',
                        message: `Your budget "${budget.name}" has been exceeded (¥${spent.toFixed(2)} / ¥${budget.amount.toFixed(2)})`,
                        isRead: false,
                        priority: 'high',
                        actionUrl: '/budgets',
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
            } else if (percentage >= 80) {
                const exists = await this.notificationRepo.getAll();
                const alreadyNotified = exists.some(
                    n => n.type === 'warning' && n.message.includes(`Budget "${budget.name}" is at ${Math.floor(percentage)}%`)
                );
                if (!alreadyNotified) {
                    await this.createNotification({
                        type: 'warning',
                        title: 'Budget Alert',
                        message: `Your budget "${budget.name}" is at ${Math.floor(percentage)}% (¥${spent.toFixed(2)} / ¥${budget.amount.toFixed(2)})`,
                        isRead: false,
                        priority: 'medium',
                        actionUrl: '/budgets',
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
            }
        }
    }

    async checkAndGenerateGoalReminders(goals: {
        id: number;
        name: string;
        targetAmount: number;
        currentAmount: number;
        deadline: string | null;
    }[]): Promise<void> {
        const now = new Date();

        for (const goal of goals) {
            if (!goal.deadline) continue;

            const deadlineDate = new Date(goal.deadline);
            const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            const progress = (goal.currentAmount / goal.targetAmount) * 100;

            if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && progress < 100) {
                const exists = await this.notificationRepo.getAll();
                const alreadyNotified = exists.some(
                    n => n.type === 'reminder' && n.message.includes(`Goal "${goal.name}" deadline approaching`)
                );
                if (!alreadyNotified) {
                    await this.createNotification({
                        type: 'reminder',
                        title: 'Goal Deadline Approaching',
                        message: `Your goal "${goal.name}" is due in ${daysUntilDeadline} days. Current progress: ${progress.toFixed(1)}%`,
                        isRead: false,
                        priority: 'high',
                        actionUrl: '/goals',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
            }

            if (daysUntilDeadline <= 0 && progress < 100) {
                const exists = await this.notificationRepo.getAll();
                const alreadyNotified = exists.some(
                    n => n.type === 'error' && n.message.includes(`Goal "${goal.name}" deadline has passed`)
                );
                if (!alreadyNotified) {
                    await this.createNotification({
                        type: 'error',
                        title: 'Goal Deadline Passed',
                        message: `Your goal "${goal.name}" deadline has passed. Progress: ${progress.toFixed(1)}%`,
                        isRead: false,
                        priority: 'high',
                        actionUrl: '/goals',
                        expiresAt: null,
                    });
                }
            }
        }
    }

    async checkAndGenerateRecurringAlerts(recurringTransactions: {
        id: number;
        description: string | null;
        amount: number;
        nextDueDate: string;
        frequency: string;
    }[]): Promise<void> {
        const now = new Date();

        for (const rt of recurringTransactions) {
            const dueDate = new Date(rt.nextDueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilDue <= 1 && daysUntilDue >= 0) {
                const exists = await this.notificationRepo.getAll();
                const alreadyNotified = exists.some(
                    n => n.type === 'reminder' && n.message.includes(`Recurring "${rt.description || 'Transaction'}" due`)
                );
                if (!alreadyNotified) {
                    await this.createNotification({
                        type: 'reminder',
                        title: 'Recurring Transaction Due',
                        message: `${rt.description || 'Transaction'} (¥${rt.amount.toFixed(2)}) is due ${this.getFrequencyText(rt.frequency)}`,
                        isRead: false,
                        priority: 'medium',
                        actionUrl: '/transactions',
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
            }
        }
    }

    private getFrequencyText(frequency: string): string {
        switch (frequency) {
            case 'daily': return 'tomorrow';
            case 'weekly': return 'in a week';
            case 'monthly': return 'this month';
            case 'yearly': return 'this year';
            default: return 'soon';
        }
    }

    async notifyAchievementUnlocked(achievement: {
        name: string;
        description: string;
        icon: string;
    }): Promise<void> {
        await this.createNotification({
            type: 'achievement',
            title: 'Achievement Unlocked! 🎉',
            message: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
            isRead: false,
            priority: 'medium',
            actionUrl: '/settings',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    async notifyCheckInReminder(hasCheckedInToday: boolean, streakDays: number): Promise<void> {
        if (hasCheckedInToday) return;

        const exists = await this.notificationRepo.getAll();
        const today = new Date().toISOString().split('T')[0];
        const alreadyNotified = exists.some(
            n => n.type === 'reminder' && n.createdAt.startsWith(today) && n.title.includes('Check-in')
        );

        if (alreadyNotified) return;

        let message = "Don't forget to check in today!";
        if (streakDays > 0) {
            message += ` Your streak is ${streakDays} days!`;
        }

        await this.createNotification({
            type: 'reminder',
            title: 'Daily Check-in',
            message,
            isRead: false,
            priority: 'low',
            actionUrl: '/',
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
    }

    async notifyNewAchievements(unlockedCount: number): Promise<void> {
        if (unlockedCount === 0) return;

        await this.createNotification({
            type: 'info',
            title: 'Progress Update',
            message: `You've unlocked ${unlockedCount} new achievement${unlockedCount > 1 ? 's' : ''}! Keep going!`,
            isRead: false,
            priority: 'low',
            actionUrl: '/settings',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    async notifyUpcomingBill(description: string, amount: number, dueDate: string): Promise<void> {
        const exists = await this.notificationRepo.getAll();
        const alreadyNotified = exists.some(
            n => n.type === 'reminder' && n.message.includes(description)
        );
        if (alreadyNotified) return;

        await this.createNotification({
            type: 'reminder',
            title: 'Upcoming Bill',
            message: `Your bill "${description}" (¥${amount.toFixed(2)}) is due on ${dueDate}`,
            isRead: false,
            priority: 'medium',
            actionUrl: '/transactions',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    async notifyLowBalance(accountName: string, balance: number, threshold: number = 1000): Promise<void> {
        if (balance >= threshold) return;

        const exists = await this.notificationRepo.getAll();
        const alreadyNotified = exists.some(
            n => n.type === 'warning' && n.message.includes(`Account "${accountName}" balance is low`)
        );
        if (alreadyNotified) return;

        await this.createNotification({
            type: 'warning',
            title: 'Low Balance Alert',
            message: `Account "${accountName}" balance is low: ¥${balance.toFixed(2)}`,
            isRead: false,
            priority: 'high',
            actionUrl: '/accounts',
            expiresAt: null,
        });
    }

    async generateDailySummary(
        income: number,
        expense: number,
        transactionCount: number,
        topCategory: { name: string; icon: string; amount: number } | null
    ): Promise<void> {
        const message = `Today: ${transactionCount} transactions, Income ¥${income.toFixed(2)}, Expense ¥${expense.toFixed(2)}`;
        const footer = topCategory
            ? ` Top spending: ${topCategory.icon} ${topCategory.name} (¥${topCategory.amount.toFixed(2)})`
            : '';

        await this.createNotification({
            type: 'info',
            title: 'Daily Summary',
            message: message + footer,
            isRead: false,
            priority: 'low',
            actionUrl: '/reports',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
    }
}