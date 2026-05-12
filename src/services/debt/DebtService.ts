import type { Debt, DebtType } from '../../services/database/schemas/Debt';
import type { DebtRepository } from '../../services/database/repositories/DebtRepository';

export class DebtService {
    private static instance: DebtService | null = null;
    private debtRepo: DebtRepository | null = null;

    private constructor() {}

    public static getInstance(): DebtService {
        if (!DebtService.instance) {
            DebtService.instance = new DebtService();
        }
        return DebtService.instance;
    }

    public setDebtRepo(repo: DebtRepository): void {
        this.debtRepo = repo;
    }

    public calculateProgress(debt: Debt): number {
        if (debt.initialAmount === 0) return 0;
        const paid = debt.initialAmount - debt.currentBalance;
        return Math.round((paid / debt.initialAmount) * 100);
    }

    public getDaysUntilDue(dueDate: string): number {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    public isOverdue(dueDate: string): boolean {
        return this.getDaysUntilDue(dueDate) < 0;
    }

    public isDueSoon(dueDate: string, days: number = 7): boolean {
        const daysRemaining = this.getDaysUntilDue(dueDate);
        return daysRemaining >= 0 && daysRemaining <= days;
    }

    public calculateMonthlyInterest(debt: Debt): number {
        if (debt.interestType === 'fixed') {
            return debt.currentBalance * (debt.interestRate / 100 / 12);
        } else {
            return debt.currentBalance * (debt.interestRate / 100 / 12);
        }
    }

    public calculateTotalInterest(debt: Debt, months: number): number {
        const monthlyRate = debt.interestRate / 100 / 12;
        let totalInterest = 0;
        let balance = debt.currentBalance;

        for (let i = 0; i < months && balance > 0; i++) {
            const interest = balance * monthlyRate;
            totalInterest += interest;
            const principal = Math.min(debt.minimumPayment - interest, balance);
            balance -= principal;
        }

        return Math.round(totalInterest * 100) / 100;
    }

    public getDebtTypeLabel(type: DebtType): string {
        const labels: Record<DebtType, string> = {
            credit_card: '信用卡',
            loan: '贷款',
            mortgage: '房贷',
            student_loan: '学生贷款',
            medical: '医疗债务',
            other: '其他',
        };
        return labels[type] || type;
    }

    public getDebtTypeIcon(type: DebtType): string {
        const icons: Record<DebtType, string> = {
            credit_card: '💳',
            loan: '💵',
            mortgage: '🏠',
            student_loan: '🎓',
            medical: '🏥',
            other: '📋',
        };
        return icons[type] || '💳';
    }

    public async getStats() {
        if (!this.debtRepo) return null;
        return this.debtRepo.getStats();
    }

    public async findDueSoon() {
        if (!this.debtRepo) return [];
        return this.debtRepo.findDueSoon(7);
    }

    public async getInterestEstimate(months: number = 12) {
        if (!this.debtRepo) return 0;
        return this.debtRepo.getInterestEstimate(months);
    }

    public groupByType(debts: Debt[]): Record<DebtType, Debt[]> {
        const grouped: Record<DebtType, Debt[]> = {
            credit_card: [],
            loan: [],
            mortgage: [],
            student_loan: [],
            medical: [],
            other: [],
        };

        debts.forEach(debt => {
            if (grouped[debt.type]) {
                grouped[debt.type].push(debt);
            }
        });

        return grouped;
    }

    public sortByPriority(debts: Debt[]): Debt[] {
        return [...debts].sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const aPriority = a.currentBalance * (a.interestRate / 100);
            const bPriority = b.currentBalance * (b.interestRate / 100);
            return bPriority - aPriority;
        });
    }
}

export const debtService = DebtService.getInstance();