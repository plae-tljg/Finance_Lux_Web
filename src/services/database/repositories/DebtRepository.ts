import { Debt, DebtQueries, SAMPLE_DEBTS } from '../schemas/Debt';
import type { BaseRepository } from './BaseRepository';
import type { QueryExecutor } from '../types/types';

export class DebtRepository implements BaseRepository<Debt> {
    private db: QueryExecutor;

    constructor(db: QueryExecutor) {
        this.db = db;
    }

    async createTable(): Promise<void> {
        await this.db.executeQuery(DebtQueries.CREATE_TABLE);
    }

    async createIndexes(): Promise<void> {
        for (const index of DebtQueries.CREATE_TABLE ? [] : [
            'CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type)',
            'CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)',
            'CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(dueDate)',
        ]) {
            await this.db.executeQuery(index);
        }
    }

    async insertInitialData(): Promise<void> {
        for (const debt of SAMPLE_DEBTS) {
            await this.db.executeQuery(
                DebtQueries.INSERT,
                [debt.name, debt.type, debt.creditor, debt.initialAmount, debt.currentBalance, debt.interestRate, debt.interestType, debt.minimumPayment, debt.dueDate, debt.startDate, debt.status, debt.notes, debt.icon, debt.color]
            );
        }
    }

    async insert(data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'paidOffAt'>): Promise<number> {
        const result = await this.db.executeQuery(
            DebtQueries.INSERT,
            [data.name, data.type, data.creditor, data.initialAmount, data.currentBalance, data.interestRate, data.interestType, data.minimumPayment, data.dueDate, data.startDate, data.status, data.notes, data.icon, data.color]
        );
        return result.insertId ?? 0;
    }

    async findAll(): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_ALL);
        return result.rows._array;
    }

    async findById(id: number): Promise<Debt | null> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_BY_ID, [id]);
        return result.rows._array[0] || null;
    }

    async findActive(): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_ACTIVE);
        return result.rows._array;
    }

    async findByType(type: Debt['type']): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_BY_TYPE, [type]);
        return result.rows._array;
    }

    async findByStatus(status: Debt['status']): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_BY_STATUS, [status]);
        return result.rows._array;
    }

    async findPaidOff(): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(DebtQueries.FIND_PAID_OFF);
        return result.rows._array;
    }

    async update(id: number, data: Partial<Debt>): Promise<boolean> {
        const result = await this.db.executeQuery(
            DebtQueries.UPDATE,
            [data.name, data.type, data.creditor, data.initialAmount, data.currentBalance, data.interestRate, data.interestType, data.minimumPayment, data.dueDate, data.startDate, data.status, data.notes, data.icon, data.color, data.paidOffAt, id]
        );
        return (result.changes ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.executeQuery(DebtQueries.DELETE, [id]);
        return (result.changes ?? 0) > 0;
    }

    async makePayment(id: number, amount: number): Promise<boolean> {
        const debt = await this.findById(id);
        if (!debt) return false;

        const newBalance = Math.max(0, debt.currentBalance - amount);
        let newStatus = debt.status;
        let paidOffAt = null;

        if (newBalance === 0 && debt.status === 'active') {
            newStatus = 'paid_off';
            paidOffAt = new Date().toISOString();
        }

        const result = await this.db.executeQuery(
            'UPDATE debts SET currentBalance = ?, status = ?, paidOffAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [newBalance, newStatus, paidOffAt, id]
        );
        return (result.changes ?? 0) > 0;
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        paidOff: number;
        totalDebt: number;
        totalPaid: number;
        totalMinimumPayment: number;
    }> {
        const all = await this.findAll();
        const activeDebts = all.filter(d => d.status === 'active');
        const paidOffDebts = all.filter(d => d.status === 'paid_off');

        return {
            total: all.length,
            active: activeDebts.length,
            paidOff: paidOffDebts.length,
            totalDebt: activeDebts.reduce((sum, d) => sum + d.currentBalance, 0),
            totalPaid: all.reduce((sum, d) => sum + (d.initialAmount - d.currentBalance), 0),
            totalMinimumPayment: activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0),
        };
    }

    async findDueSoon(days: number = 7): Promise<Debt[]> {
        const result = await this.db.executeQuery<Debt>(
            `SELECT * FROM debts WHERE status = 'active' AND date(dueDate) <= date('now', '+${days} days') ORDER BY dueDate ASC`
        );
        return result.rows._array;
    }

    async getInterestEstimate(months: number = 12): Promise<number> {
        const activeDebts = await this.findActive();
        let totalInterest = 0;

        for (const debt of activeDebts) {
            if (debt.interestType === 'fixed') {
                const monthlyRate = debt.interestRate / 100 / 12;
                const payment = debt.minimumPayment;
                let balance = debt.currentBalance;

                for (let i = 0; i < months && balance > 0; i++) {
                    const interest = balance * monthlyRate;
                    totalInterest += interest;
                    const principal = Math.min(payment - interest, balance);
                    balance -= principal;
                }
            } else {
                totalInterest += debt.currentBalance * (debt.interestRate / 100) * (months / 12);
            }
        }

        return Math.round(totalInterest * 100) / 100;
    }
}