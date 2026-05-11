import { useMemo } from 'react';
import { useAppState } from '../../contexts/AppStateContext';

interface Insight {
    icon: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    description: string;
    action?: string;
}

export const FinancialInsights: React.FC = () => {
    const { state } = useAppState();
    const { transactions, budgets, accounts, categories, selectedMonth } = state;

    const currentMonthTransactions = useMemo(() =>
        transactions.filter((t: any) => t.date.startsWith(selectedMonth)),
        [transactions, selectedMonth]
    );

    const insights = useMemo((): Insight[] => {
        const result: Insight[] = [];
        const currentMonthBudgets = budgets.filter((b: any) => b.month === selectedMonth);

        const totalIncome = currentMonthTransactions
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const totalExpense = currentMonthTransactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

        if (savingsRate >= 50) {
            result.push({
                icon: '🌟',
                type: 'success',
                title: 'Excellent Savings Rate',
                description: `Your savings rate is ${savingsRate.toFixed(1)}% this month. Keep up the great work!`,
            });
        } else if (savingsRate >= 20 && savingsRate < 50) {
            result.push({
                icon: '👍',
                type: 'success',
                title: 'Good Savings Progress',
                description: `You're saving ${savingsRate.toFixed(1)}% of your income. Consider increasing it to 50%.`,
            });
        } else if (savingsRate < 20 && totalIncome > 0) {
            result.push({
                icon: '💡',
                type: 'tip',
                title: 'Boost Your Savings',
                description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim to save at least 20% of your income.`,
                action: 'Create a savings goal',
            });
        }

        const overBudgetCategories = currentMonthBudgets.filter((budget: any) => {
            const spent = currentMonthTransactions
                .filter((t: any) => t.budgetId === budget.id)
                .reduce((sum: number, t: any) => sum + t.amount, 0);
            return spent > budget.amount;
        });

        if (overBudgetCategories.length > 0) {
            const totalOverspend = overBudgetCategories.reduce((sum: number, budget: any) => {
                const spent = currentMonthTransactions
                    .filter((t: any) => t.budgetId === budget.id)
                    .reduce((sum: number, t: any) => sum + t.amount, 0);
                return sum + (spent - budget.amount);
            }, 0);
            result.push({
                icon: '⚠️',
                type: 'warning',
                title: 'Over Budget Alert',
                description: `${overBudgetCategories.length} categor${overBudgetCategories.length > 1 ? 'ies are' : 'y is'} over budget by ¥${totalOverspend.toLocaleString()}. Consider reducing expenses.`,
            });
        }

        const topExpenseCategory = useMemo(() => {
            const categoryTotals: Record<number, number> = {};
            currentMonthTransactions
                .filter((t: any) => t.type === 'expense')
                .forEach((t: any) => {
                    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
                });
            const maxCategoryId = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0];
            return categories.find((c: any) => c.id === Number(maxCategoryId));
        }, [currentMonthTransactions, categories]);

        if (topExpenseCategory && totalExpense > 0) {
            const categoryTotal = currentMonthTransactions
                .filter((t: any) => t.type === 'expense' && t.categoryId === topExpenseCategory.id)
                .reduce((sum: number, t: any) => sum + t.amount, 0);
            const percentage = ((categoryTotal / totalExpense) * 100).toFixed(1);
            result.push({
                icon: '📊',
                type: 'info',
                title: 'Top Spending Category',
                description: `${topExpenseCategory.icon} ${topExpenseCategory.name} accounts for ${percentage}% of your expenses (¥${categoryTotal.toLocaleString()}).`,
            });
        }

        const recentTransactionsCount = currentMonthTransactions.length;
        if (recentTransactionsCount === 0) {
            result.push({
                icon: '📝',
                type: 'tip',
                title: 'Start Recording',
                description: 'No transactions recorded this month. Start tracking your finances!',
                action: 'Add transaction',
            });
        } else if (recentTransactionsCount < 10) {
            result.push({
                icon: '📈',
                type: 'tip',
                title: 'More Tracking Needed',
                description: `Only ${recentTransactionsCount} transactions recorded. Detailed tracking leads to better insights.`,
            });
        }

        const now = new Date();
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthProgress = (dayOfMonth / daysInMonth) * 100;

        const expectedExpense = (totalIncome * 0.8);
        if (totalExpense > expectedExpense && monthProgress < 50) {
            result.push({
                icon: '🚨',
                type: 'warning',
                title: 'High Spending Pace',
                description: `You've spent ${((totalExpense / expectedExpense) * 100).toFixed(0)}% of your safe spending limit with ${(100 - monthProgress).toFixed(0)}% of the month remaining.`,
            });
        }

        const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
        if (totalBalance < totalExpense * 3) {
            result.push({
                icon: '🏦',
                type: 'warning',
                title: 'Emergency Fund Low',
                description: 'Your savings cover less than 3 months of expenses. Consider building an emergency fund.',
                action: 'Set a goal',
            });
        }

        const recurringTransactions = currentMonthTransactions.filter((t: any) => t.description?.toLowerCase().includes('subscription') || t.description?.toLowerCase().includes('recurring'));
        if (recurringTransactions.length > 0) {
            const recurringTotal = recurringTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
            result.push({
                icon: '🔄',
                type: 'info',
                title: 'Recurring Expenses',
                description: `You have ${recurringTransactions.length} recurring transaction${recurringTransactions.length > 1 ? 's' : ''} totaling ¥${recurringTotal.toLocaleString()}/month.`,
            });
        }

        return result.slice(0, 4);
    }, [currentMonthTransactions, budgets, selectedMonth, categories, accounts]);

    const typeStyles: Record<string, { bg: string; border: string; iconBg: string }> = {
        success: {
            bg: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20',
            border: 'border-green-500/30',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
        },
        warning: {
            bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
            border: 'border-amber-500/30',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        },
        info: {
            bg: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
            border: 'border-blue-500/30',
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
        },
        tip: {
            bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
            border: 'border-purple-500/30',
            iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        },
    };

    if (insights.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
                const styles = typeStyles[insight.type];
                return (
                    <div
                        key={index}
                        className={`group ${styles.bg} backdrop-blur-xl rounded-2xl shadow-xl border ${styles.border} p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`${styles.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {insight.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 group-hover:bg-clip-text transition-all duration-300">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};